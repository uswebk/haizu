import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { employees } from "../db/schema";

const employeeInput = z.object({
	code: z.string().min(1),
	lastName: z.string().min(1),
	firstName: z.string().min(1),
	avatarColor: z.string(),
	tags: z.array(z.string()),
	isActive: z.boolean(),
});

export const employeesRoute = new Hono()
	.get("/", async (c) => {
		const rows = await db
			.select()
			.from(employees)
			.orderBy(employees.createdAt);

		return c.json({ employees: rows });
	})

	.post("/", zValidator("json", employeeInput), async (c) => {
		const input = c.req.valid("json");

		const inserted = await db.insert(employees).values(input).returning();
		const employee = inserted[0];
		if (!employee) return c.json({ error: "Insert failed" }, 500);

		return c.json(employee, 201);
	})

	.put("/:id", zValidator("json", employeeInput), async (c) => {
		const { id } = c.req.param();
		const input = c.req.valid("json");

		const updated = await db
			.update(employees)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(employees.id, id))
			.returning();
		const employee = updated[0];
		if (!employee) return c.json({ error: "Not found" }, 404);

		return c.json(employee);
	});
