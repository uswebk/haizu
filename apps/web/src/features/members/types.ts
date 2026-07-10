import type { OrgRole, SiteRole } from "@haizu/shared";

export type MemberStatus = "active" | "inactive" | "invited";

// 拠点ごとの権限。「A拠点=拠点管理者 / B拠点=一般」を表現する。
export type SiteRoleAssignment = { siteId: string; role: SiteRole };

export type MemberRow = {
	id: string;
	// user = 既存メンバー / invitation = 招待中（未登録）
	kind: "user" | "invitation";
	name: string;
	email: string;
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
	// 管理者は全拠点アクセス（siteRoles は空）
	allSites: boolean;
	status: MemberStatus;
};
