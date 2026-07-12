import { effectiveSiteRole, SiteInputSchema, type SiteRole } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq, inArray, ne } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { employees, memberSites, sites } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireOrgWritePermission } from "../middleware/require-permission";
import type { AppEnv } from "../types";

const MAX_SITES = 10;

// Color palette for site icons (matches the prototype). Numbered as sites are added.
const ICON_PALETTE = [
	{ bg: "#dcf2f0", color: "#0ea5a4" },
	{ bg: "#e3eefe", color: "#2f6df0" },
	{ bg: "#fbecd8", color: "#e07b1a" },
	{ bg: "#eae3fb", color: "#7c4dda" },
	{ bg: "#fde4ec", color: "#e0447b" },
];

export const sitesRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", requireOrgWritePermission("site:manage"))
	.get("/", async (c) => {
		const organizationId = c.get("organizationId");
		const actor = c.get("user");

		// Domain: a site is visible only to invited members (admins see all sites)
		let allowedSiteIds: string[] | null = null;
		// Effective role per site. Used by the frontend's screen/nav control.
		const roleBySite = new Map<string, SiteRole>();
		if (actor.role !== "admin") {
			const links = await db
				.select({ siteId: memberSites.siteId, role: memberSites.role })
				.from(memberSites)
				.where(eq(memberSites.userId, actor.id));
			allowedSiteIds = links.map((l) => l.siteId);
			for (const l of links) roleBySite.set(l.siteId, l.role);
			if (allowedSiteIds.length === 0) {
				return c.json({ sites: [] });
			}
		}

		const rows = await db
			.select({
				id: sites.id,
				organizationId: sites.organizationId,
				name: sites.name,
				description: sites.description,
				iconBg: sites.iconBg,
				iconColor: sites.iconColor,
				isActive: sites.isActive,
				createdAt: sites.createdAt,
				updatedAt: sites.updatedAt,
				employeeCount: count(employees.id),
			})
			.from(sites)
			.leftJoin(employees, eq(employees.siteId, sites.id))
			.where(
				allowedSiteIds
					? and(
							eq(sites.organizationId, organizationId),
							inArray(sites.id, allowedSiteIds),
						)
					: eq(sites.organizationId, organizationId),
			)
			.groupBy(sites.id)
			.orderBy(sites.createdAt, sites.name);

		const withRole = rows.map((row) => ({
			...row,
			// Admins are equivalent to site admins at every site. Members follow their member_sites assignments.
			role: effectiveSiteRole(actor.role, roleBySite.get(row.id) ?? null),
		}));
		return c.json({ sites: withRole });
	})

	.post("/", zValidator("json", SiteInputSchema), async (c) => {
		const { name, description, isActive } = c.req.valid("json");
		const organizationId = c.get("organizationId");

		const existing = await db
			.select({ value: count() })
			.from(sites)
			.where(eq(sites.organizationId, organizationId));
		const total = existing[0]?.value ?? 0;
		if (total >= MAX_SITES) {
			return c.json({ error: `Up to ${MAX_SITES} sites are allowed` }, 400);
		}

		const icon = ICON_PALETTE[total % ICON_PALETTE.length] ?? {
			bg: "#dcf2f0",
			color: "#0ea5a4",
		};
		const site = await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(sites)
				.values({
					organizationId,
					name,
					description,
					iconBg: icon.bg,
					iconColor: icon.color,
					isActive,
				})
				.returning();
			const row = inserted[0];
			if (!row) throw new Error("Insert failed");
			return row;
		});

		return c.json(site, 201);
	})

	.put("/:id", zValidator("json", SiteInputSchema), async (c) => {
		const { id } = c.req.param();
		const { name, description, isActive } = c.req.valid("json");
		const organizationId = c.get("organizationId");

		const target = await db.query.sites.findFirst({
			where: and(eq(sites.id, id), eq(sites.organizationId, organizationId)),
		});
		if (!target) return c.json({ error: "Not found" }, 404);

		// Domain: sites can't be deleted, only deactivated. The last active site can't be deactivated.
		if (target.isActive && !isActive) {
			const others = await db
				.select({ value: count() })
				.from(sites)
				.where(
					and(
						eq(sites.organizationId, target.organizationId),
						eq(sites.isActive, true),
						ne(sites.id, id),
					),
				);
			if ((others[0]?.value ?? 0) === 0) {
				return c.json(
					{ error: "You can't deactivate the last active site" },
					400,
				);
			}
		}

		const updated = await db
			.update(sites)
			.set({ name, description, isActive, updatedAt: new Date() })
			.where(eq(sites.id, id))
			.returning();

		return c.json(updated[0]);
	});
