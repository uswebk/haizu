import type { DisplayRole } from "@haizu/shared";
import { useTranslation } from "react-i18next";

// Hook that resolves the display-role label in the current locale.
export function useRoleLabel(): (role: DisplayRole) => string {
	const { t } = useTranslation("roles");
	return (role: DisplayRole) => t(role);
}
