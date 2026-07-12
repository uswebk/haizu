import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { assignments } from "../../db/schema";

// A version that assignments already point at is frozen: editing its spots or floor plan would
// silently change what was assigned on-site. Editing means creating a new version.
export const LOCKED_MESSAGE =
	"This spec is in use by an assignment and can't be edited. Create a new version to edit it.";

export async function hasAssignmentsForVersion(versionId: string) {
	const found = await db.query.assignments.findFirst({
		where: eq(assignments.layoutSpecVersionId, versionId),
	});
	return !!found;
}

export async function versionIdsWithAssignments(versionIds: string[]) {
	if (versionIds.length === 0) return new Set<string>();
	const rows = await db
		.selectDistinct({ versionId: assignments.layoutSpecVersionId })
		.from(assignments)
		.where(inArray(assignments.layoutSpecVersionId, versionIds));
	return new Set(rows.map((r) => r.versionId));
}
