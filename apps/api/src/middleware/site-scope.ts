import { effectiveSiteRole } from "@haizu/shared";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/client";
import { memberSites, sites } from "../db/schema";
import type { AppEnv } from "../types";

// Used after requireAuth. Verifies that the site selected via x-site-id belongs to the
// session user's organization, and (for non-admins) that they are a member invited to that site
// (prevents spoofed access to other orgs' sites or sites the user wasn't invited to).
// It also resolves the effective role at that site and puts it on siteRole.
export const siteScope = createMiddleware<AppEnv>(async (c, next) => {
	const siteId = c.req.header("x-site-id");
	if (!siteId) {
		return c.json({ error: "x-site-id header is required" }, 400);
	}

	const site = await db.query.sites.findFirst({
		where: eq(sites.id, siteId),
	});
	if (!site || !site.isActive) {
		return c.json({ error: "Site not found" }, 404);
	}
	if (site.organizationId !== c.get("organizationId")) {
		return c.json({ error: "You don't have access to this site" }, 403);
	}

	const actor = c.get("user");
	const membership = await db.query.memberSites.findFirst({
		where: and(
			eq(memberSites.userId, actor.id),
			eq(memberSites.siteId, site.id),
		),
	});
	const role = effectiveSiteRole(actor.role, membership?.role ?? null);
	if (!role) {
		return c.json({ error: "You don't have access to this site" }, 403);
	}

	c.set("siteId", site.id);
	c.set("siteRole", role);
	await next();
});
