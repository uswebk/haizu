import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { employees, employeeTags, tags } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireSiteWritePermission } from "../middleware/require-permission";
import { siteScope } from "../middleware/site-scope";
import type { AppEnv } from "../types";

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

const DUPLICATE_CODE_MESSAGE = "This employee code is already in use";

function isUniqueViolation(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	if ("code" in error && (error as { code?: unknown }).code === "23505") {
		return true;
	}
	// drizzle-orm wraps driver errors in a DrizzleQueryError,
	// and the original Postgres error (including code) is stored in cause
	const cause = (error as { cause?: unknown }).cause;
	return isUniqueViolation(cause);
}

export const employeesRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", siteScope)
	.use("*", requireSiteWritePermission("employee:write"))
	.get("/", async (c) => {
		const rows = await db
			.select()
			.from(employees)
			.where(eq(employees.siteId, c.get("siteId")))
			.orderBy(employees.createdAt);

		return c.json({ employees: await attachTags(rows) });
	})

	.post("/", zValidator("json", employeeInput), async (c) => {
		const { tagIds, ...input } = c.req.valid("json");

		let employee: typeof employees.$inferSelect;
		try {
			const inserted = await db
				.insert(employees)
				.values({ ...input, siteId: c.get("siteId") })
				.returning();
			const row = inserted[0];
			if (!row) return c.json({ error: "Insert failed" }, 500);
			employee = row;
		} catch (error) {
			if (isUniqueViolation(error)) {
				return c.json({ error: DUPLICATE_CODE_MESSAGE }, 400);
			}
			throw error;
		}

		await setEmployeeTags(employee.id, tagIds);

		const [result] = await attachTags([employee]);
		return c.json(result, 201);
	})

	.post(
		"/import",
		zValidator("json", z.object({ employees: z.array(employeeInput).min(1) })),
		async (c) => {
			const siteId = c.get("siteId");
			const { employees: incoming } = c.req.valid("json");

			// Verify that all referenced tags belong to this site (prevents mixing in other sites' tags)
			const referencedTagIds = [...new Set(incoming.flatMap((e) => e.tagIds))];
			if (referencedTagIds.length > 0) {
				const siteTags = await db
					.select({ id: tags.id })
					.from(tags)
					.where(
						and(eq(tags.siteId, siteId), inArray(tags.id, referencedTagIds)),
					);
				const validTagIds = new Set(siteTags.map((t) => t.id));
				const invalid = referencedTagIds.filter((id) => !validTagIds.has(id));
				if (invalid.length > 0) {
					return c.json(
						{ error: "Includes a tag that doesn't exist at this site" },
						400,
					);
				}
			}

			try {
				await db.transaction(async (tx) => {
					for (const { tagIds, ...input } of incoming) {
						const inserted = await tx
							.insert(employees)
							.values({ ...input, siteId })
							.returning();
						const row = inserted[0];
						if (!row) throw new Error("Insert failed");
						if (tagIds.length > 0) {
							await tx
								.insert(employeeTags)
								.values(tagIds.map((tagId) => ({ employeeId: row.id, tagId })));
						}
					}
				});
			} catch (error) {
				if (isUniqueViolation(error)) {
					return c.json({ error: DUPLICATE_CODE_MESSAGE }, 400);
				}
				throw error;
			}

			return c.json({ created: incoming.length }, 201);
		},
	)

	.put("/:id", zValidator("json", employeeInput), async (c) => {
		const { id } = c.req.param();
		const { tagIds, ...input } = c.req.valid("json");

		let employee: typeof employees.$inferSelect;
		try {
			const updated = await db
				.update(employees)
				.set({ ...input, updatedAt: new Date() })
				.where(and(eq(employees.id, id), eq(employees.siteId, c.get("siteId"))))
				.returning();
			const row = updated[0];
			if (!row) return c.json({ error: "Not found" }, 404);
			employee = row;
		} catch (error) {
			if (isUniqueViolation(error)) {
				return c.json({ error: DUPLICATE_CODE_MESSAGE }, 400);
			}
			throw error;
		}

		await setEmployeeTags(employee.id, tagIds);

		const [result] = await attachTags([employee]);
		return c.json(result);
	});
