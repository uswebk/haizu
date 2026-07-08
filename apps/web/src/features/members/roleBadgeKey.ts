import type { Role } from "@haiz/shared";
import type { Role as RoleBadgeRole } from "#/components/ui/RoleBadge";

// 共有の Role enum を RoleBadge のキーへ変換する（キー名が一部異なるため）。
export function roleBadgeKey(role: Role): RoleBadgeRole {
	switch (role) {
		case "site_admin":
			return "site";
		case "viewer":
			return "other";
		default:
			return role;
	}
}
