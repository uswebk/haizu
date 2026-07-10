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

// 現在拠点はURL(/s/$siteId)が真実。apiFetch は同期的に値が要るため、
// 拠点レイアウトが解決した siteId をここへ流し込む。
// SSR中はリクエスト間でモジュール変数が共有されるため、クライアントでのみ保持する。
let currentSiteId: string | null = null;

export function getCurrentSiteId(): string | null {
	if (typeof window === "undefined") return null;
	return currentSiteId;
}

export function setCurrentSiteId(id: string): void {
	currentSiteId = id;
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
