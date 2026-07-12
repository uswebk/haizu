import type { OrgRole, SiteRole } from "@haizu/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { memberSites, sites } from "../../db/schema";

export type SiteRoleAssignment = { siteId: string; role: SiteRole };

export type Actor = { id: string; role: OrgRole };

// Sites where the operator can set site roles. Admins get all sites in the org
export async function manageableSiteIds(
	organizationId: string,
	actor: Actor,
): Promise<string[]> {
	if (actor.role === "admin") {
		const rows = await db
			.select({ id: sites.id })
			.from(sites)
			.where(eq(sites.organizationId, organizationId));
		return rows.map((r) => r.id);
	}
	const rows = await db
		.select({ siteId: memberSites.siteId })
		.from(memberSites)
		.where(
			and(eq(memberSites.userId, actor.id), eq(memberSites.role, "site_admin")),
		);
	return rows.map((r) => r.siteId);
}

// Verify all given site ids belong to the organization (prevents mixing in other orgs' sites)
export async function assertSitesInOrg(
	organizationId: string,
	siteIds: string[],
) {
	if (siteIds.length === 0) return true;
	const rows = await db
		.select({ id: sites.id })
		.from(sites)
		.where(
			and(eq(sites.organizationId, organizationId), inArray(sites.id, siteIds)),
		);
	return rows.length === siteIds.length;
}
