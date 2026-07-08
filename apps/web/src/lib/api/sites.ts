import type { SiteInput } from "@haizu/shared";
import { API_BASE, apiFetch } from ".";

export type Site = {
	id: string;
	organizationId: string;
	name: string;
	description: string;
	iconBg: string;
	iconColor: string;
	isActive: boolean;
	employeeCount: number;
};

async function handleResponse<T>(res: Response): Promise<T> {
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

export const siteKeys = {
	all: ["sites"] as const,
};

export async function fetchSites(): Promise<Site[]> {
	const res = await apiFetch(`${API_BASE}/sites`);
	const data = await handleResponse<{ sites: Site[] }>(res);
	return data.sites;
}

export async function createSite(input: SiteInput): Promise<Site> {
	const res = await apiFetch(`${API_BASE}/sites`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export async function updateSite(id: string, input: SiteInput): Promise<Site> {
	const res = await apiFetch(`${API_BASE}/sites/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}
