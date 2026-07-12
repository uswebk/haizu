import type { AssignmentInput } from "@haizu/shared";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import {
	areas,
	assignments,
	layoutSpecVersions,
	spotAssignments,
	workPatterns,
} from "../../db/schema";
import { isUsableForDate } from "../areas/version";

type Rejection = { error: string; status: 400 | 404 };

// Preconditions for assigning employees to a spec on a date. Order matters: a missing work pattern
// is reported before anything about the area, since shifts are what assignment is organized by.
export async function validateAssignmentTarget(
	siteId: string,
	input: AssignmentInput,
): Promise<Rejection | null> {
	const workPattern = await db.query.workPatterns.findFirst({
		where: eq(workPatterns.siteId, siteId),
	});
	if (!workPattern) {
		return {
			error: "Assignment isn't possible because no work pattern is registered",
			status: 400,
		};
	}

	const area = await db.query.areas.findFirst({
		where: and(eq(areas.id, input.areaId), eq(areas.siteId, siteId)),
	});
	if (!area) return { error: "Not found", status: 404 };

	const version = await db.query.layoutSpecVersions.findFirst({
		where: eq(layoutSpecVersions.id, input.layoutSpecVersionId),
	});
	// A draft spec isn't reflected on-site, so it can't be assigned against
	if (!version || version.status !== "published") {
		return {
			error: "This spec is unpublished, so it can't be used for assignment",
			status: 400,
		};
	}
	if (!isUsableForDate(version, input.date)) {
		return { error: "This spec doesn't apply to this date yet", status: 400 };
	}

	return null;
}

// An assignment is identified by (area, date, shift). Saving replaces its spot assignments wholesale.
export async function saveAssignment(input: AssignmentInput) {
	return db.transaction(async (tx) => {
		const existing = await tx
			.select()
			.from(assignments)
			.where(
				and(
					eq(assignments.areaId, input.areaId),
					eq(assignments.date, input.date),
					input.shiftId
						? eq(assignments.shiftId, input.shiftId)
						: isNull(assignments.shiftId),
				),
			);

		const current = existing[0];
		const saved = current
			? (
					await tx
						.update(assignments)
						.set({
							layoutSpecVersionId: input.layoutSpecVersionId,
							status: input.status,
							updatedAt: new Date(),
						})
						.where(eq(assignments.id, current.id))
						.returning()
				)[0]
			: (
					await tx
						.insert(assignments)
						.values({
							areaId: input.areaId,
							layoutSpecVersionId: input.layoutSpecVersionId,
							date: input.date,
							shiftId: input.shiftId,
							status: input.status,
						})
						.returning()
				)[0];
		if (!saved) throw new Error("Failed to upsert assignment");

		await tx
			.delete(spotAssignments)
			.where(eq(spotAssignments.assignmentId, saved.id));
		if (input.spotAssignments.length > 0) {
			await tx.insert(spotAssignments).values(
				input.spotAssignments.map((spotAssignment) => ({
					assignmentId: saved.id,
					spotId: spotAssignment.spotId,
					employeeId: spotAssignment.employeeId,
				})),
			);
		}
		return saved;
	});
}
