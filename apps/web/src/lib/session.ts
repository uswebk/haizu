import type { OrgRole, SiteRole } from "@haizu/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { API_BASE } from "#/lib/api";

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	role: OrgRole;
	organizationId: string;
	isActive: boolean;
};

// SSR時も含めてリクエスト単位でセッションを解決する。ブラウザ用シングルトンの
// authClient をSSRの認可判定に使うと、単一のSSRプロセス上で状態が全ユーザー間で
// 共有され、別ブラウザの操作で他ユーザーがログアウト扱いになる。ここでは受信リクエストの
// Cookie を明示的にAPIへ転送して解決するため、その混線が起きない。
export const fetchSession = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionUser | null> => {
		const cookie = getRequest().headers.get("cookie") ?? "";
		const res = await fetch(`${API_BASE}/api/auth/get-session`, {
			headers: { cookie },
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { user?: SessionUser } | null;
		return data?.user ?? null;
	},
);

export type AccessibleSite = {
	id: string;
	name: string;
	role: SiteRole;
	isActive: boolean;
};

// URL の siteId に対する実効ロールを解決する。存在しない・所属していない拠点なら null。
// /sites は自分がアクセスできる拠点だけを、拠点ごとの実効ロール付きで返す。
export const fetchSiteRole = createServerFn({ method: "GET" })
	.inputValidator((siteId: string) => siteId)
	.handler(async ({ data: siteId }): Promise<SiteRole | null> => {
		const cookie = getRequest().headers.get("cookie") ?? "";
		const res = await fetch(`${API_BASE}/sites`, { headers: { cookie } });
		if (!res.ok) return null;
		const data = (await res.json()) as { sites: AccessibleSite[] };
		const site = data.sites.find((s) => s.id === siteId && s.isActive);
		return site?.role ?? null;
	});
