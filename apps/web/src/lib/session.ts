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

// Resolve the session per request, including during SSR. Using the browser-singleton
// authClient for SSR authorization would share state across all users on a single SSR process,
// so another browser's action could log out other users. Here we forward the incoming request's
// cookie explicitly to the API to resolve it, so that crossover doesn't happen.
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

// Resolve the effective role for the URL's siteId. null for a nonexistent site or one you don't belong to.
// /sites returns only the sites you can access, each with its effective role.
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
