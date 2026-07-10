export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// APIレスポンスの共通ハンドラ。エラー時はサーバの { error } メッセージを優先して throw する。
export async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		const message =
			body &&
			typeof body === "object" &&
			"error" in body &&
			typeof body.error === "string"
				? body.error
				: `API error: ${res.status}`;
		throw new Error(message);
	}
	return res.json() as Promise<T>;
}

// 現在拠点はURL(/s/$siteId/...)が真実なので、常にURLから読む。
// beforeLoad で変数へ流し込む方式だと、SSR済みページのハイドレート時に
// beforeLoad がクライアントで再実行されず、x-site-id が欠落する。
// SSR中は window が無く、モジュール変数はリクエスト間で共有されるため null を返す。
const SITE_PATH_PATTERN = /^\/s\/([^/]+)/;

export function getCurrentSiteId(): string | null {
	if (typeof window === "undefined") return null;
	const match = window.location.pathname.match(SITE_PATH_PATTERN);
	return match?.[1] ?? null;
}

// 拠点スコープの各APIへ、現在拠点IDを x-site-id ヘッダーとして自動付与する fetch ラッパ。
export function apiFetch(
	input: string,
	init: RequestInit = {},
): Promise<Response> {
	const siteId = getCurrentSiteId();
	const headers = new Headers(init.headers);
	if (siteId) headers.set("x-site-id", siteId);
	return fetch(input, { ...init, headers, credentials: "include" });
}
