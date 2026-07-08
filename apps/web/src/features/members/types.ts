import type { Role } from "@haiz/shared";

export type MemberStatus = "active" | "inactive" | "invited";

export type MemberRow = {
	id: string;
	// user = 既存メンバー / invitation = 招待中（未登録）
	kind: "user" | "invitation";
	name: string;
	email: string;
	role: Role;
	// 担当拠点の id 配列。allSites が true のときは全拠点アクセス（内容は空）。
	siteIds: string[];
	allSites: boolean;
	status: MemberStatus;
};
