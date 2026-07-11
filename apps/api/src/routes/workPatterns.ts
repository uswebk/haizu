import { WorkPatternInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { shifts, workPatterns } from "../db/schema";
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
			const existingById = new Map(existing.map((r) => [r.id, r]));
			// Names are unique within the current shifts. Even if the id is stale/missing, match existing rows by name
			// so unchanged rows aren't mistakenly soft-deleted + re-inserted
			// fixme: e.g. when a Night record is deleted and a new Night record is created, I thought it wouldn't be removed but it was. Maybe it's not removed if the time is also the same?
			// this area adds complexity, so consider whether the design can be simplified
			// e.g. even with the same name, once a record is deleted, delete it and add a new record
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

			// Soft-delete first to free up the partial-unique slot, then insert
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
