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

// 現在拠点はCookieに保持する。ルートの beforeLoad は SSR でも走るため、
// localStorage だと「現在拠点における実効ロール」をサーバー側で解決できない。
export const SITE_ID_KEY = "haizu.currentSiteId";

export function getCurrentSiteId(): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${SITE_ID_KEY}=([^;]*)`),
	);
	return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function setCurrentSiteId(id: string): void {
	if (typeof document === "undefined") return;
	const oneYear = 60 * 60 * 24 * 365;
	document.cookie = `${SITE_ID_KEY}=${encodeURIComponent(id)}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function clearCurrentSiteId(): void {
	if (typeof document === "undefined") return;
	document.cookie = `${SITE_ID_KEY}=; path=/; max-age=0; SameSite=Lax`;
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
