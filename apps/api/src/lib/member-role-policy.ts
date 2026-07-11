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
		return { ok: false, status: 403, message: "自身の権限は変更できません" };
	}
	// Only admins can create admins. Non-admins can't touch existing admins either (prevents privilege escalation)
	if (
		actorOrgRole !== "admin" &&
		(targetOrgRole === "admin" || nextOrgRole === "admin")
	) {
		return {
			ok: false,
			status: 403,
			message: "拠点管理者は管理者権限を設定できません",
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
		message: "権限を設定できない拠点が含まれています",
	};
}
