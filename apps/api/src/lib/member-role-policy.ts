import type { OrgRole } from "@haizu/shared";

export type RoleAssignmentResult =
	| { ok: true }
	| { ok: false; status: 403; message: string };

type OrgRoleAssignment = {
	actorOrgRole: OrgRole;
	// 自分自身への権限変更か。招待（対象が未作成）では常に false。
	isSelf: boolean;
	// 対象の現在の組織ロール。招待では対象がまだ存在しないため null。
	targetOrgRole: OrgRole | null;
	nextOrgRole: OrgRole;
};

// 組織ロールを割り当てられるかを判定する（member_permission.md のルール）。
// 招待（POST /members/invite）と更新（PUT /members/:id）で共有する。
export function evaluateOrgRoleAssignment({
	actorOrgRole,
	isSelf,
	targetOrgRole,
	nextOrgRole,
}: OrgRoleAssignment): RoleAssignmentResult {
	if (isSelf && nextOrgRole !== targetOrgRole) {
		return { ok: false, status: 403, message: "自身の権限は変更できません" };
	}
	// 管理者を作れるのは管理者だけ。既存の管理者にも管理者以外は手を出せない（権限昇格の防止）
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

// 拠点ロールを変更してよい拠点かを判定する。
// 拠点管理者は「自分が拠点管理者である拠点」のメンバーしか触れない（member_permission.md）。
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
