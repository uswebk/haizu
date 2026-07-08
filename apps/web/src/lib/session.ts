import type { Role } from "@haizu/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { API_BASE } from "#/lib/api";

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	role: Role;
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
