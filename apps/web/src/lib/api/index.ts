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

const SITE_ID_KEY = "haizu.currentSiteId";

export function getCurrentSiteId(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(SITE_ID_KEY);
}

export function setCurrentSiteId(id: string): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(SITE_ID_KEY, id);
}

export function clearCurrentSiteId(): void {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(SITE_ID_KEY);
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
