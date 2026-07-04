import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { tags } from "../db/schema";

export const tagsRoute = new Hono()
	.get("/", async (c) => {
		const rows = await db.select().from(tags).orderBy(tags.createdAt);
		return c.json({ tags: rows });
	})

	.post("/", zValidator("json", z.object({ name: z.string().min(1) })), async (c) => {
		const { name } = c.req.valid("json");

		const inserted = await db.insert(tags).values({ name }).returning();
		const tag = inserted[0];
		if (!tag) return c.json({ error: "Insert failed" }, 500);

		return c.json(tag, 201);
	});
