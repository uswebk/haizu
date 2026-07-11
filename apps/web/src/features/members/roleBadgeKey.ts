import type { DisplayRole } from "@haizu/shared";
import type { Role as RoleBadgeRole } from "#/components/ui/RoleBadge";

// Convert the shared DisplayRole to a RoleBadge key (some key names differ).
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
