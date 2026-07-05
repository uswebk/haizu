import { zValidator } from "@hono/zod-validator";
import { ViewerConfigInputSchema } from "@haiz/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { shifts, viewerConfigs } from "../db/schema";

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

export const viewerConfigsRoute = new Hono()
	.get("/", async (c) => {
		// shifts は left join（ソフト削除済みでも name/時刻は保持されるため表示に使える）
		const rows = await db
			.select({
				config: viewerConfigs,
				shiftName: shifts.name,
				shiftStartTime: shifts.startTime,
				shiftEndTime: shifts.endTime,
			})
			.from(viewerConfigs)
			.leftJoin(shifts, eq(viewerConfigs.shiftId, shifts.id));
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
