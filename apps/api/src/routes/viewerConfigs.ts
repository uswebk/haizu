import { zValidator } from "@hono/zod-validator";
import { ViewerConfigInputSchema } from "@haiz/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { viewerConfigs } from "../db/schema";

const paramSchema = z.object({ areaId: z.string().uuid() });

function serialize(row: typeof viewerConfigs.$inferSelect) {
	return {
		areaId: row.areaId,
		mode: row.mode,
		displayDate: row.displayDate,
		shiftId: row.shiftId,
		leadMinutes: row.leadMinutes,
	};
}

export const viewerConfigsRoute = new Hono()
	.get("/", async (c) => {
		const rows = await db.select().from(viewerConfigs);
		return c.json({ configs: rows.map(serialize) });
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
			return c.json(serialize(row));
		},
	);
