import { ViewerConfigInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { areas, shifts, viewerConfigs } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireSiteWritePermission } from "../middleware/require-permission";
import { siteScope } from "../middleware/site-scope";
import type { AppEnv } from "../types";

const paramSchema = z.object({ areaId: z.string().uuid() });

type ShiftInfo = {
	name: string | null;
	startTime: string | null;
	endTime: string | null;
};

function serialize(row: typeof viewerConfigs.$inferSelect, shift: ShiftInfo) {
	return {
		areaId: row.areaId,
		mode: row.mode,
		displayDate: row.displayDate,
		shiftId: row.shiftId,
		shiftName: shift.name,
		shiftStartTime: shift.startTime,
		shiftEndTime: shift.endTime,
		leadMinutes: row.leadMinutes,
	};
}

export const viewerConfigsRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", siteScope)
	.use("*", requireSiteWritePermission("viewer_config:write"))
	.get("/", async (c) => {
		// shifts は left join（ソフト削除済みでも name/時刻は保持されるため表示に使える）
		// エリア経由で現在拠点に絞り込む
		const rows = await db
			.select({
				config: viewerConfigs,
				shiftName: shifts.name,
				shiftStartTime: shifts.startTime,
				shiftEndTime: shifts.endTime,
			})
			.from(viewerConfigs)
			.innerJoin(areas, eq(viewerConfigs.areaId, areas.id))
			.leftJoin(shifts, eq(viewerConfigs.shiftId, shifts.id))
			.where(eq(areas.siteId, c.get("siteId")));
		return c.json({
			configs: rows.map((r) =>
				serialize(r.config, {
					name: r.shiftName,
					startTime: r.shiftStartTime,
					endTime: r.shiftEndTime,
				}),
			),
		});
	})

	.put(
		"/:areaId",
		zValidator("param", paramSchema),
		zValidator("json", ViewerConfigInputSchema),
		async (c) => {
			const { areaId } = c.req.valid("param");
			const input = c.req.valid("json");

			// 対象エリアが現在拠点に属することを検証する
			const area = await db.query.areas.findFirst({
				where: and(eq(areas.id, areaId), eq(areas.siteId, c.get("siteId"))),
			});
			if (!area) return c.json({ error: "Not found" }, 404);

			const existing = await db.query.viewerConfigs.findFirst({
				where: eq(viewerConfigs.areaId, areaId),
			});

			const saved = existing
				? await db
						.update(viewerConfigs)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(viewerConfigs.areaId, areaId))
						.returning()
				: await db
						.insert(viewerConfigs)
						.values({ areaId, ...input })
						.returning();

			const row = saved[0];
			if (!row) return c.json({ error: "Save failed" }, 500);

			const shift = row.shiftId
				? await db.query.shifts.findFirst({
						where: eq(shifts.id, row.shiftId),
					})
				: null;
			return c.json(
				serialize(row, {
					name: shift?.name ?? null,
					startTime: shift?.startTime ?? null,
					endTime: shift?.endTime ?? null,
				}),
			);
		},
	);
