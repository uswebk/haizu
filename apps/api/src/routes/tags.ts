import { zValidator } from "@hono/zod-validator";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { employeeTags, tags } from "../db/schema";

const tagInput = z.object({ name: z.string().min(1).max(20) });

const DUPLICATE_NAME_MESSAGE = "このタグ名は既に使用されています";

function isUniqueViolation(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	if ("code" in error && (error as { code?: unknown }).code === "23505") {
		return true;
	}
	// drizzle-orm は driver のエラーを DrizzleQueryError でラップし、
	// 元のPostgresエラー（code含む）は cause に格納される
	const cause = (error as { cause?: unknown }).cause;
	return isUniqueViolation(cause);
}

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

		try {
			const inserted = await db.insert(tags).values({ name }).returning();
			const tag = inserted[0];
			if (!tag) return c.json({ error: "Insert failed" }, 500);

			return c.json(tag, 201);
		} catch (error) {
			if (isUniqueViolation(error)) {
				return c.json({ error: DUPLICATE_NAME_MESSAGE }, 400);
			}
			throw error;
		}
	})

	.put("/:id", zValidator("json", tagInput), async (c) => {
		const { id } = c.req.param();
		const { name } = c.req.valid("json");

		try {
			const updated = await db
				.update(tags)
				.set({ name })
				.where(eq(tags.id, id))
				.returning();
			const tag = updated[0];
			if (!tag) return c.json({ error: "Not found" }, 404);

			return c.json(tag);
		} catch (error) {
			if (isUniqueViolation(error)) {
				return c.json({ error: DUPLICATE_NAME_MESSAGE }, 400);
			}
			throw error;
		}
	})

	.delete("/:id", async (c) => {
		const { id } = c.req.param();

		const deleted = await db.delete(tags).where(eq(tags.id, id)).returning();
		if (!deleted[0]) return c.json({ error: "Not found" }, 404);

		return c.body(null, 204);
	});
