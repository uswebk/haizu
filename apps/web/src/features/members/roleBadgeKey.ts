import type { DisplayRole } from "@haizu/shared";
import type { Role as RoleBadgeRole } from "#/components/ui/RoleBadge";

// 共有の DisplayRole を RoleBadge のキーへ変換する（キー名が一部異なるため）。
export function roleBadgeKey(role: DisplayRole): RoleBadgeRole {
	switch (role) {
		case "site_admin":
			return "site";
		case "viewer":
			return "other";
		default:
			return role;
	}
}
