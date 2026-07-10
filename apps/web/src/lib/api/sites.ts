import type { SiteInput, SiteRole } from "@haizu/shared";
import { API_BASE, apiFetch, handleResponse } from ".";

export type Site = {
	id: string;
	organizationId: string;
	name: string;
	description: string;
	iconBg: string;
	iconColor: string;
	isActive: boolean;
	employeeCount: number;
	role: SiteRole;
};

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
