import {
	canAccessScreen,
	landingScreen,
	type OrgRole,
	type Screen,
	type SiteRole,
} from "@haizu/shared";
import { redirect } from "@tanstack/react-router";

// 拠点スコープの画面の閲覧権限を検査する。権限が無ければそのロールの着地画面へ送り返す。
// 権限表は @haizu/shared が単一の情報源で、APIの認可と共有している。
// 判定は「URLの拠点における実効ロール」で行う（拠点ごとに権限が異なる）。
export function assertScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
	siteId: string,
	screen: Screen,
) {
	if (canAccessScreen(orgRole, siteRole, screen)) return;

	const landing = landingScreen(orgRole, siteRole);
	if (landing === "account") throw redirect({ to: "/account" });
	throw redirect({
		to: landing === "home" ? "/s/$siteId/home" : "/s/$siteId/viewer",
		params: { siteId },
	});
}
