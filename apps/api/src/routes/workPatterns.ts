import { WorkPatternInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { shifts, workPatterns } from "../db/schema";
import { diffShifts } from "../features/work-patterns/diff";
import { requireAuth } from "../middleware/auth";
import { requireSiteWritePermission } from "../middleware/require-permission";
import { siteScope } from "../middleware/site-scope";
import type { AppEnv } from "../types";

async function loadShifts(workPatternId: string) {
	return db
		.select()
		.from(shifts)
		.where(
			and(eq(shifts.workPatternId, workPatternId), isNull(shifts.deletedAt)),
		)
		.orderBy(shifts.order);
}

export const workPatternsRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", siteScope)
	.use("*", requireSiteWritePermission("shift:write"))
	.get("/", async (c) => {
		const workPattern = await db.query.workPatterns.findFirst({
			where: eq(workPatterns.siteId, c.get("siteId")),
		});
		// A work pattern isn't auto-created when a site is created. Returns null if none is registered
		if (!workPattern) return c.json(null);
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
		const existingPattern = await db.query.workPatterns.findFirst({
			where: eq(workPatterns.siteId, c.get("siteId")),
		});
		// Even for a site with none registered, saving creates it (the user registers the work pattern explicitly)
		const workPattern =
			existingPattern ??
			(
				await db
					.insert(workPatterns)
					.values({ siteId: c.get("siteId"), mode })
					.returning()
			)[0];
		if (!workPattern) return c.json({ error: "Insert failed" }, 500);

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
			const { kept, toInsert, softDelete } = diffShifts(existing, rows);

			// Soft-delete first to free up the partial-unique slot, then insert
			if (softDelete.length > 0) {
				await tx
					.update(shifts)
					.set({ deletedAt: new Date() })
					.where(inArray(shifts.id, softDelete));
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
