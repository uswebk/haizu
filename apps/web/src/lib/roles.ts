import type { Role } from "@haiz/shared";

export const ROLE_LABEL: Record<Role, string> = {
	admin: "管理者",
	site_admin: "拠点管理者",
	general: "一般",
	viewer: "その他",
};
