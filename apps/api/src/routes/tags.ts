import { zValidator } from "@hono/zod-validator";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { employeeTags, tags } from "../db/schema";

const tagInput = z.object({ name: z.string().min(1) });

export const tagsRoute = new Hono()
	.get("/", async (c) => {
		const rows = await db
			.select({
				id: tags.id,
				name: tags.name,
				createdAt: tags.createdAt,
				employeeCount: count(employeeTags.employeeId),
			})
			.from(tags)
			.leftJoin(employeeTags, eq(employeeTags.tagId, tags.id))
			.groupBy(tags.id)
			.orderBy(tags.createdAt);

		return c.json({ tags: rows });
	})

	.post("/", zValidator("json", tagInput), async (c) => {
		const { name } = c.req.valid("json");

		const inserted = await db.insert(tags).values({ name }).returning();
		const tag = inserted[0];
		if (!tag) return c.json({ error: "Insert failed" }, 500);

		return c.json(tag, 201);
	})

	.put("/:id", zValidator("json", tagInput), async (c) => {
		const { id } = c.req.param();
		const { name } = c.req.valid("json");

		const updated = await db
			.update(tags)
			.set({ name })
			.where(eq(tags.id, id))
			.returning();
		const tag = updated[0];
		if (!tag) return c.json({ error: "Not found" }, 404);

		return c.json(tag);
	})

	.delete("/:id", async (c) => {
		const { id } = c.req.param();

		const deleted = await db.delete(tags).where(eq(tags.id, id)).returning();
		if (!deleted[0]) return c.json({ error: "Not found" }, 404);

		return c.body(null, 204);
	});
