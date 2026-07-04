import { zValidator } from "@hono/zod-validator";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { employeeTags, employees, tags } from "../db/schema";

const employeeInput = z.object({
	code: z.string().min(1),
	lastName: z.string().min(1),
	firstName: z.string().min(1),
	avatarColor: z.string(),
	tagIds: z.array(z.string().uuid()),
	isActive: z.boolean(),
});

async function attachTags<T extends { id: string }>(
	rows: T[],
): Promise<(T & { tags: { id: string; name: string }[] })[]> {
	if (rows.length === 0) return [];

	const links = await db
		.select({
			employeeId: employeeTags.employeeId,
			tagId: tags.id,
			tagName: tags.name,
		})
		.from(employeeTags)
		.innerJoin(tags, eq(employeeTags.tagId, tags.id))
		.where(
			inArray(
				employeeTags.employeeId,
				rows.map((r) => r.id),
			),
		);

	return rows.map((row) => ({
		...row,
		tags: links
			.filter((l) => l.employeeId === row.id)
			.map((l) => ({ id: l.tagId, name: l.tagName })),
	}));
}

async function setEmployeeTags(employeeId: string, tagIds: string[]) {
	await db.delete(employeeTags).where(eq(employeeTags.employeeId, employeeId));
	if (tagIds.length > 0) {
		await db
			.insert(employeeTags)
			.values(tagIds.map((tagId) => ({ employeeId, tagId })));
	}
}

export const employeesRoute = new Hono()
	.get("/", async (c) => {
		const rows = await db
			.select()
			.from(employees)
			.orderBy(employees.createdAt);

		return c.json({ employees: await attachTags(rows) });
	})

	.post("/", zValidator("json", employeeInput), async (c) => {
		const { tagIds, ...input } = c.req.valid("json");

		const inserted = await db.insert(employees).values(input).returning();
		const employee = inserted[0];
		if (!employee) return c.json({ error: "Insert failed" }, 500);

		await setEmployeeTags(employee.id, tagIds);

		const [result] = await attachTags([employee]);
		return c.json(result, 201);
	})

	.put("/:id", zValidator("json", employeeInput), async (c) => {
		const { id } = c.req.param();
		const { tagIds, ...input } = c.req.valid("json");

		const updated = await db
			.update(employees)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(employees.id, id))
			.returning();
		const employee = updated[0];
		if (!employee) return c.json({ error: "Not found" }, 404);

		await setEmployeeTags(employee.id, tagIds);

		const [result] = await attachTags([employee]);
		return c.json(result);
	});
