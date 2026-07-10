import { AssignmentInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
} from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import {
	areas,
	assignments,
	layoutSpecVersions,
	shifts,
	spotAssignments,
	workPatterns,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
	requireSitePermission,
	requireSiteWritePermission,
} from "../middleware/require-permission";
import { siteScope } from "../middleware/site-scope";
import type { AppEnv } from "../types";

// 現在拠点に属するエリアIDの一覧。配置は area 経由で拠点にスコープされる。
async function siteAreaIds(siteId: string): Promise<string[]> {
	const rows = await db
		.select({ id: areas.id })
		.from(areas)
		.where(eq(areas.siteId, siteId));
	return rows.map((r) => r.id);
}

const listQuery = z.object({
	date: z.string().date(),
	shiftId: z.string().uuid().optional(),
});

const dateQuery = z.object({
	date: z.string().date(),
});

const historyQuery = z.object({
	date: z.string().date(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

const shiftsUsedQuery = z.object({
	areaId: z.string().uuid(),
	date: z.string().date().optional(),
});

type AssignmentRow = typeof assignments.$inferSelect;

// assignmentId ごとにグルーピングした spotAssignments を一括取得する
async function loadSpotAssignmentsByAssignmentIds(assignmentIds: string[]) {
	const grouped = new Map<string, { spotId: string; employeeId: string }[]>();
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

export const assignmentsRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", siteScope)
	.use("*", requireSiteWritePermission("assignment:write"))
	.get("/shift-mismatch", zValidator("query", dateQuery), async (c) => {
		const { date } = c.req.valid("query");
		const areaIds = await siteAreaIds(c.get("siteId"));

		const found = await db
			.select({ id: assignments.id })
			.from(assignments)
			.innerJoin(shifts, eq(assignments.shiftId, shifts.id))
			.where(
				and(
					inArray(assignments.areaId, areaIds),
					eq(assignments.date, date),
					isNotNull(shifts.deletedAt),
				),
			)
			.limit(1);

		return c.json({ mismatched: found.length > 0 });
	})

	// 指定エリア（・指定日）で確定済み配置に紐づいたことのあるシフト一覧（削除済みシフトも含む）。
	// 配置ビュアー設定の強制表示で「その日に実際確定していたシフト」を選び直せるようにするため。
	.get("/shifts-used", zValidator("query", shiftsUsedQuery), async (c) => {
		const { areaId, date } = c.req.valid("query");

		const areaIds = await siteAreaIds(c.get("siteId"));
		if (!areaIds.includes(areaId)) return c.json({ shifts: [] });

		const rows = await db
			.selectDistinct({
				id: shifts.id,
				name: shifts.name,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				order: shifts.order,
				deleted: isNotNull(shifts.deletedAt),
			})
			.from(assignments)
			.innerJoin(shifts, eq(assignments.shiftId, shifts.id))
			.where(
				and(
					eq(assignments.areaId, areaId),
					eq(assignments.status, "confirmed"),
					date ? eq(assignments.date, date) : undefined,
				),
			)
			.orderBy(asc(shifts.order));

		return c.json({ shifts: rows });
	})

	.get(
		"/history",
		requireSitePermission("assignment_history:read"),
		zValidator("query", historyQuery),
		async (c) => {
			const { date, limit = 50, offset = 0 } = c.req.valid("query");
			const areaIds = await siteAreaIds(c.get("siteId"));

			const where = and(
				inArray(assignments.areaId, areaIds),
				eq(assignments.status, "confirmed"),
				eq(assignments.date, date),
			);

			const [{ total } = { total: 0 }] = await db
				.select({ total: count() })
				.from(assignments)
				.where(where);

			// shifts は left join（soft-delete 済みでも name は保持されるため当時のシフト名を表示できる）
			const rows = await db
				.select({
					id: assignments.id,
					areaId: assignments.areaId,
					areaName: areas.name,
					date: assignments.date,
					shiftId: assignments.shiftId,
					shiftName: shifts.name,
					shiftOrder: shifts.order,
					layoutSpecVersionId: assignments.layoutSpecVersionId,
				})
				.from(assignments)
				.innerJoin(areas, eq(assignments.areaId, areas.id))
				.leftJoin(shifts, eq(assignments.shiftId, shifts.id))
				.where(where)
				.orderBy(desc(assignments.date), asc(shifts.order), asc(areas.name))
				.limit(limit)
				.offset(offset);

			const membersByAssignment = await loadSpotAssignmentsByAssignmentIds(
				rows.map((r) => r.id),
			);

			const entries = rows.map((r) => ({
				id: r.id,
				areaId: r.areaId,
				areaName: r.areaName,
				date: r.date,
				shiftId: r.shiftId,
				shiftName: r.shiftName,
				layoutSpecVersionId: r.layoutSpecVersionId,
				employeeIds: (membersByAssignment.get(r.id) ?? []).map(
					(m) => m.employeeId,
				),
			}));

			return c.json({ entries, total });
		},
	)

	.get("/", zValidator("query", listQuery), async (c) => {
		const { date, shiftId } = c.req.valid("query");
		const areaIds = await siteAreaIds(c.get("siteId"));

		const rows = await db
			.select()
			.from(assignments)
			.where(
				and(
					inArray(assignments.areaId, areaIds),
					eq(assignments.date, date),
					shiftId
						? eq(assignments.shiftId, shiftId)
						: isNull(assignments.shiftId),
				),
			);

		const spotAssignmentsByAssignmentId =
			await loadSpotAssignmentsByAssignmentIds(rows.map((row) => row.id));
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

		// 勤務体制が未登録の拠点では配置決めできない（シフトが配置の前提）
		const workPattern = await db.query.workPatterns.findFirst({
			where: eq(workPatterns.siteId, c.get("siteId")),
		});
		if (!workPattern) {
			return c.json({ error: "勤務体制が未登録のため配置決めできません" }, 400);
		}

		// 対象エリアが現在拠点に属することを検証する
		const area = await db.query.areas.findFirst({
			where: and(eq(areas.id, input.areaId), eq(areas.siteId, c.get("siteId"))),
		});
		if (!area) return c.json({ error: "Not found" }, 404);

		// 配置決めは公開済みの規格に対してのみ行える（下書き規格は現場に未反映のため対象外）
		const version = await db.query.layoutSpecVersions.findFirst({
			where: eq(layoutSpecVersions.id, input.layoutSpecVersionId),
		});
		if (!version || version.status !== "published") {
			return c.json({ error: "この規格は未公開のため配置決めできません" }, 400);
		}

		if (!version.effectiveDate || version.effectiveDate > input.date) {
			return c.json(
				{ error: "この規格はこの日付にはまだ適用されていません" },
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
