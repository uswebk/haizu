import type { OrgRole } from "@haizu/shared";

export type RoleAssignmentResult =
	| { ok: true }
	| { ok: false; status: 403; message: string };

type OrgRoleAssignment = {
	actorOrgRole: OrgRole;
	// Whether this is a permission change to oneself. Always false for invitations (target not yet created).
	isSelf: boolean;
	// The target's current org role. null for invitations since the target doesn't exist yet.
	targetOrgRole: OrgRole | null;
	nextOrgRole: OrgRole;
};

// Decides whether an org role may be assigned (rules in member_permission.md).
// Shared by invite (POST /members/invite) and update (PUT /members/:id).
export function evaluateOrgRoleAssignment({
	actorOrgRole,
	isSelf,
	targetOrgRole,
	nextOrgRole,
}: OrgRoleAssignment): RoleAssignmentResult {
	if (isSelf && nextOrgRole !== targetOrgRole) {
		return { ok: false, status: 403, message: "You can't change your own role" };
	}
	// Only admins can create admins. Non-admins can't touch existing admins either (prevents privilege escalation)
	if (
		actorOrgRole !== "admin" &&
		(targetOrgRole === "admin" || nextOrgRole === "admin")
	) {
		return {
			ok: false,
			status: 403,
			message: "Site admins can't grant the admin role",
		};
	}
	return { ok: true };
}

// Decides whether a site's role may be changed.
// A site admin can only touch members of sites where they are a site admin (member_permission.md).
export function assertSitesManageable(
	manageableSiteIds: readonly string[],
	targetSiteIds: readonly string[],
): RoleAssignmentResult {
	const allowed = new Set(manageableSiteIds);
	if (targetSiteIds.every((id) => allowed.has(id))) return { ok: true };
	return {
		ok: false,
		status: 403,
		message: "Includes a site you can't set permissions for",
	};
}
