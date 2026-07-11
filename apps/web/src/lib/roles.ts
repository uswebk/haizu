import type { DisplayRole } from "@haizu/shared";
import { useTranslation } from "react-i18next";

// 表示ロールのラベルを現在のロケールで解決するフック。
export function useRoleLabel(): (role: DisplayRole) => string {
	const { t } = useTranslation("roles");
	return (role: DisplayRole) => t(role);
}
