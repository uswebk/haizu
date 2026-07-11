import {
	type OrgRole,
	SITE_ROLES,
	type SiteRole,
} from "./schemas/user";

// Single source of truth for permissions. Both the API's authorization
// middleware and the frontend's screen/nav control read this table (avoids duplicating permission definitions across API and UI).
// Organization-scoped operations. They span sites, so they are decided by OrgRole.
export const ORG_PERMISSIONS = {
	"org:write": ["admin"],
	"site:manage": ["admin"],
} as const satisfies Record<string, readonly OrgRole[]>;

export type OrgPermission = keyof typeof ORG_PERMISSIONS;

// Site-scoped operations. Decided by the SiteRole at the target site.
export const SITE_PERMISSIONS = {
	"member:manage": ["site_admin"],
	"employee:write": ["site_admin"],
	"area:write": ["site_admin"],
	"assignment:write": ["site_admin"],
	"shift:write": ["site_admin"],
	"tag:write": ["site_admin"],
	"viewer_config:write": ["site_admin"],
	"assignment_history:read": ["site_admin", "general"],
	// Common read access to site data. The viewer screen needs layout areas,
	// assignments, employees, and shifts, so it is open to all site roles including viewer. Per-screen control is done in SCREENS.
	"site_data:read": SITE_ROLES,
} as const satisfies Record<string, readonly SiteRole[]>;

export type SitePermission = keyof typeof SITE_PERMISSIONS;

// Admins act as site admins at every site. They don't need a membership (member_sites).
// A member without membership at the site gets null (= no access to that site's data at all).
export function effectiveSiteRole(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): SiteRole | null {
	return orgRole === "admin" ? "site_admin" : siteRole;
}

export function canOrg(orgRole: OrgRole, permission: OrgPermission): boolean {
	return (ORG_PERMISSIONS[permission] as readonly OrgRole[]).includes(orgRole);
}

export function canSite(
	siteRole: SiteRole | null,
	permission: SitePermission,
): boolean {
	if (!siteRole) return false;
	return (SITE_PERMISSIONS[permission] as readonly SiteRole[]).includes(
		siteRole,
	);
}

// Permissions for screens (frontend routes). Used by sidebar nav visibility and route guards.
// Organization-scoped screens are decided by OrgRole, site-scoped screens by the effective SiteRole.
const ORG_SCREENS = {
	sites: ["admin"],
	"organization-settings": ["admin"],
} as const satisfies Record<string, readonly OrgRole[]>;

const SITE_SCREENS = {
	home: ["site_admin", "general"],
	editor: ["site_admin"],
	assignment: ["site_admin"],
	history: ["site_admin", "general"],
	viewer: SITE_ROLES,
	employees: ["site_admin"],
	settings: ["site_admin"],
	members: ["site_admin"],
} as const satisfies Record<string, readonly SiteRole[]>;

export type Screen =
	| keyof typeof ORG_SCREENS
	| keyof typeof SITE_SCREENS
	// Editing one's own info is allowed for all roles, so it belongs to neither scope.
	| "account";

export function canAccessScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
	screen: Screen,
): boolean {
	if (screen === "account") return true;
	if (screen in ORG_SCREENS) {
		const allowed = ORG_SCREENS[screen as keyof typeof ORG_SCREENS];
		return (allowed as readonly OrgRole[]).includes(orgRole);
	}
	const allowed = SITE_SCREENS[screen as keyof typeof SITE_SCREENS];
	const effective = effectiveSiteRole(orgRole, siteRole);
	if (!effective) return false;
	return (allowed as readonly SiteRole[]).includes(effective);
}

// Role for display purposes. Collapses the org role and site role into a single label.
// Do not use this for authorization decisions (use canOrg / canSite).
export type DisplayRole = "admin" | SiteRole;

export function displayRole(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): DisplayRole | null {
	if (orgRole === "admin") return "admin";
	return siteRole;
}

// Landing screen right after login / after selecting a site. Roles that can't see Home are sent to the viewer.
// A member with no site membership can't see any site data, so they go to account settings.
// The path depends on the site (siteId), so URL assembly is left to the caller.
export function landingScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
): "home" | "viewer" | "account" {
	if (canAccessScreen(orgRole, siteRole, "home")) return "home";
	if (canAccessScreen(orgRole, siteRole, "viewer")) return "viewer";
	return "account";
}
