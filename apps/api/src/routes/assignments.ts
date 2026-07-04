import { zValidator } from "@hono/zod-validator";
import { AssignmentInputSchema } from "@haiz/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { assignments, layoutSpecVersions, spotAssignments } from "../db/schema";

const listQuery = z.object({
	date: z.string().date(),
	shiftId: z.string().uuid().optional(),
});

type AssignmentRow = typeof assignments.$inferSelect;

// assignmentId ごとにグルーピングした spotAssignments を一括取得する
// fixme: 配置決めでv1の規格で登録後 -> 配置エリアで新しいv2を公開
//        配置決めに戻ると、規格はv2になっているが、配置状況は人数が設定されたままになっている。
async function loadSpotAssignmentsByAssignmentIds(assignmentIds: string[]) {
	const grouped = new Map<
		string,
		{ spotId: string; employeeId: string }[]
	>();
	if (assignmentIds.length === 0) return grouped;

	const rows = await db
		.select()
		.from(spotAssignments)
		.where(inArray(spotAssignments.assignmentId, assignmentIds));
	for (const row of rows) {
		const list = grouped.get(row.assignmentId) ?? [];
		list.push({ spotId: row.spotId, employeeId: row.employeeId });
		grouped.set(row.assignmentId, list);
	}
	return grouped;
}

function serialize(
	assignment: AssignmentRow,
	spotAssignmentsList: { spotId: string; employeeId: string }[],
) {
	return {
		id: assignment.id,
		areaId: assignment.areaId,
		layoutSpecVersionId: assignment.layoutSpecVersionId,
		date: assignment.date,
		shiftId: assignment.shiftId,
		status: assignment.status,
		spotAssignments: spotAssignmentsList,
	};
}

export const assignmentsRoute = new Hono()
	.get("/", zValidator("query", listQuery), async (c) => {
		const { date, shiftId } = c.req.valid("query");

		const rows = await db
			.select()
			.from(assignments)
			.where(
				and(
					eq(assignments.date, date),
					shiftId
						? eq(assignments.shiftId, shiftId)
						: isNull(assignments.shiftId),
				),
			);

		const spotAssignmentsByAssignmentId = await loadSpotAssignmentsByAssignmentIds(
			rows.map((row) => row.id),
		);
		const result = rows.map((assignment) =>
			serialize(
				assignment,
				spotAssignmentsByAssignmentId.get(assignment.id) ?? [],
			),
		);
		return c.json({ assignments: result });
	})

	.put("/", zValidator("json", AssignmentInputSchema), async (c) => {
		const input = c.req.valid("json");

		// 配置決めは公開済みの規格に対してのみ行える（下書き規格は現場に未反映のため対象外）
		const version = await db.query.layoutSpecVersions.findFirst({
			where: eq(layoutSpecVersions.id, input.layoutSpecVersionId),
		});
		if (!version || version.status !== "published") {
			return c.json(
				{ error: "この規格は未公開のため配置決めできません" },
				400,
			);
		}

		const saved = await db.transaction(async (tx) => {
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

			let assignment = existing[0];
			if (assignment) {
				const updated = await tx
					.update(assignments)
					.set({
						layoutSpecVersionId: input.layoutSpecVersionId,
						status: input.status,
						updatedAt: new Date(),
					})
					.where(eq(assignments.id, assignment.id))
					.returning();
				assignment = updated[0];
			} else {
				const inserted = await tx
					.insert(assignments)
					.values({
						areaId: input.areaId,
						layoutSpecVersionId: input.layoutSpecVersionId,
						date: input.date,
						shiftId: input.shiftId,
						status: input.status,
					})
					.returning();
				assignment = inserted[0];
			}
			if (!assignment) throw new Error("Failed to upsert assignment");

			await tx
				.delete(spotAssignments)
				.where(eq(spotAssignments.assignmentId, assignment.id));
			if (input.spotAssignments.length > 0) {
				await tx.insert(spotAssignments).values(
					input.spotAssignments.map((spotAssignment) => ({
						assignmentId: assignment.id,
						spotId: spotAssignment.spotId,
						employeeId: spotAssignment.employeeId,
					})),
				);
			}
			return assignment;
		});

		return c.json(serialize(saved, input.spotAssignments));
	});
