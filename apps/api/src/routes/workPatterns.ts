import { zValidator } from "@hono/zod-validator";
import { WorkPatternInputSchema } from "@haiz/shared";
import { eq } from "drizzle-orm";
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
		.where(eq(shifts.workPatternId, workPatternId))
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

		await db
			.update(workPatterns)
			.set({ mode, updatedAt: new Date() })
			.where(eq(workPatterns.id, workPattern.id));

		await db.delete(shifts).where(eq(shifts.workPatternId, workPattern.id));

		// シフトなしは区分を持たない
		const rows = mode === "single" ? [] : newShifts;
		if (rows.length > 0) {
			await db.insert(shifts).values(
				rows.map((s, i) => ({
					workPatternId: workPattern.id,
					name: s.name,
					startTime: s.startTime,
					endTime: s.endTime,
					order: i,
				})),
			);
		}

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
