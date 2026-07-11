export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// Common handler for API responses. On error, throws preferring the server's { error } message.
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

// The current site's source of truth is the URL (/s/$siteId/...), so always read it from the URL.
// Feeding it into a variable in beforeLoad would, when hydrating an SSR'd page,
// not re-run beforeLoad on the client, so x-site-id would be missing.
// During SSR there's no window and module variables are shared across requests, so return null.
const SITE_PATH_PATTERN = /^\/s\/([^/]+)/;

export function getCurrentSiteId(): string | null {
	if (typeof window === "undefined") return null;
	const match = window.location.pathname.match(SITE_PATH_PATTERN);
	return match?.[1] ?? null;
}

// fetch wrapper that automatically adds the current site id as an x-site-id header to each site-scoped API call.
export function apiFetch(
	input: string,
	init: RequestInit = {},
): Promise<Response> {
	const siteId = getCurrentSiteId();
	const headers = new Headers(init.headers);
	if (siteId) headers.set("x-site-id", siteId);
	return fetch(input, { ...init, headers, credentials: "include" });
}
