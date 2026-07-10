import type { OrgRole, SiteRole } from "@haizu/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { API_BASE, SITE_ID_KEY } from "#/lib/api";

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	role: OrgRole;
	organizationId: string;
	isActive: boolean;
};

// 現在拠点における実効ロール。拠点未選択・未所属なら null。
export type AuthContext = { user: SessionUser; siteRole: SiteRole | null };

function readCookie(cookie: string, key: string): string | null {
	const match = cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
	return match?.[1] ? decodeURIComponent(match[1]) : null;
}

// SSR時も含めてリクエスト単位でセッションを解決する。ブラウザ用シングルトンの
// authClient をSSRの認可判定に使うと、単一のSSRプロセス上で状態が全ユーザー間で
// 共有され、別ブラウザの操作で他ユーザーがログアウト扱いになる。ここでは受信リクエストの
// Cookie を明示的にAPIへ転送して解決するため、その混線が起きない。
export const fetchSession = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthContext | null> => {
		const cookie = getRequest().headers.get("cookie") ?? "";
		const res = await fetch(`${API_BASE}/api/auth/get-session`, {
			headers: { cookie },
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { user?: SessionUser } | null;
		const user = data?.user;
		if (!user) return null;

		// 拠点ロールは拠点ごとに異なりうるため、現在拠点のものを解決する。
		// /sites は各拠点における実効ロールを返す（管理者は全拠点 site_admin）。
		const siteId = readCookie(cookie, SITE_ID_KEY);
		if (!siteId) return { user, siteRole: null };

		const sitesRes = await fetch(`${API_BASE}/sites`, { headers: { cookie } });
		if (!sitesRes.ok) return { user, siteRole: null };
		const sitesData = (await sitesRes.json()) as {
			sites: { id: string; role: SiteRole }[];
		};
		const current = sitesData.sites.find((s) => s.id === siteId);
		return { user, siteRole: current?.role ?? null };
	},
);
