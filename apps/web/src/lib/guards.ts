import {
	canAccessScreen,
	landingScreen,
	type OrgRole,
	type Screen,
	type SiteRole,
} from "@haizu/shared";
import { redirect } from "@tanstack/react-router";

// 画面の閲覧権限を検査する。権限が無ければそのロールの既定画面へ送り返す。
// 権限表は @haizu/shared が単一の情報源で、APIの認可と共有している。
// 拠点スコープの画面は「現在拠点における実効ロール」で判定される。
export function assertScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
	screen: Screen,
) {
	if (!canAccessScreen(orgRole, siteRole, screen)) {
		throw redirect({ to: landingScreen(orgRole, siteRole) });
	}
}
