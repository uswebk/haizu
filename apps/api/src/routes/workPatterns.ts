import { zValidator } from "@hono/zod-validator";
import { WorkPatternInputSchema } from "@haiz/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { shifts, workPatterns } from "../db/schema";

async function getOrCreateWorkPattern() {
	const existing = await db.query.workPatterns.findFirst();
	if (existing) return existing;

	const inserted = await db.insert(workPatterns).values({}).returning();
	const created = inserted[0];
	if (!created) throw new Error("Failed to create work pattern");
	return created;
}

async function loadShifts(workPatternId: string) {
	return db
		.select()
		.from(shifts)
		.where(
			and(eq(shifts.workPatternId, workPatternId), isNull(shifts.deletedAt)),
		)
		.orderBy(shifts.order);
}

export const workPatternsRoute = new Hono()
	.get("/", async (c) => {
		const workPattern = await getOrCreateWorkPattern();
		const rows = await loadShifts(workPattern.id);

		return c.json({
			mode: workPattern.mode,
			shifts: rows.map((s) => ({
				id: s.id,
				name: s.name,
				startTime: s.startTime,
				endTime: s.endTime,
				order: s.order,
			})),
		});
	})

	.put("/", zValidator("json", WorkPatternInputSchema), async (c) => {
		const { mode, shifts: newShifts } = c.req.valid("json");
		const workPattern = await getOrCreateWorkPattern();

		const rows = mode === "single" ? [] : newShifts;

		await db.transaction(async (tx) => {
			await tx
				.update(workPatterns)
				.set({ mode, updatedAt: new Date() })
				.where(eq(workPatterns.id, workPattern.id));

			const existing = await tx
				.select()
				.from(shifts)
				.where(
					and(
						eq(shifts.workPatternId, workPattern.id),
						isNull(shifts.deletedAt),
					),
				);
			const existingById = new Map(existing.map((r) => [r.id, r]));
			// 名前は現行シフト内で一意。id が古く/欠けていても名前で既存行を照合し、
			// 未変更行を誤って soft-delete + 再挿入しないようにする
			const existingByName = new Map(existing.map((r) => [r.name, r]));

			const handled = new Set<string>();
			const kept: { id: string; order: number }[] = [];
			const toInsert: {
				name: string;
				startTime: string;
				endTime: string;
				order: number;
			}[] = [];
			const softDelete = new Set<string>();

			rows.forEach((s, i) => {
				const ex =
					(s.id ? existingById.get(s.id) : undefined) ??
					existingByName.get(s.name);
				if (ex && !handled.has(ex.id)) {
					handled.add(ex.id);
					if (
						ex.name === s.name &&
						ex.startTime === s.startTime &&
						ex.endTime === s.endTime
					) {
						kept.push({ id: ex.id, order: i });
					} else {
						softDelete.add(ex.id);
						toInsert.push({
							name: s.name,
							startTime: s.startTime,
							endTime: s.endTime,
							order: i,
						});
					}
				} else {
					toInsert.push({
						name: s.name,
						startTime: s.startTime,
						endTime: s.endTime,
						order: i,
					});
				}
			});

			for (const id of existingById.keys()) {
				if (!handled.has(id)) softDelete.add(id);
			}

			// 先に soft-delete して部分unique の枠を空けてから insert する
			if (softDelete.size > 0) {
				await tx
					.update(shifts)
					.set({ deletedAt: new Date() })
					.where(inArray(shifts.id, [...softDelete]));
			}
			if (toInsert.length > 0) {
				await tx.insert(shifts).values(
					toInsert.map((s) => ({
						workPatternId: workPattern.id,
						name: s.name,
						startTime: s.startTime,
						endTime: s.endTime,
						order: s.order,
					})),
				);
			}
			for (const k of kept) {
				await tx
					.update(shifts)
					.set({ order: k.order })
					.where(eq(shifts.id, k.id));
			}
		});

		const saved = await loadShifts(workPattern.id);
		return c.json({
			mode,
			shifts: saved.map((s) => ({
				id: s.id,
				name: s.name,
				startTime: s.startTime,
				endTime: s.endTime,
				order: s.order,
			})),
		});
	});
