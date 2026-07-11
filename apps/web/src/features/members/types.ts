import type { OrgRole, SiteRole } from "@haizu/shared";

export type MemberStatus = "active" | "inactive" | "invited";

// Per-site permission. Represents "site A = site admin / site B = general".
export type SiteRoleAssignment = { siteId: string; role: SiteRole };

export type MemberRow = {
	id: string;
	// user = existing member / invitation = pending invite (not yet registered)
	kind: "user" | "invitation";
	name: string;
	email: string;
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
	// Admins have all-site access (siteRoles is empty)
	allSites: boolean;
	status: MemberStatus;
};
