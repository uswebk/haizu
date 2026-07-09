import { API_BASE, apiFetch, handleResponse } from ".";

export type OrganizationView = {
	id: string;
	name: string;
	email: string | null;
	isActive: boolean;
};

export const organizationKeys = {
	detail: ["organization"] as const,
};

export async function fetchOrganization(): Promise<OrganizationView> {
	const res = await apiFetch(`${API_BASE}/organizations`);
	return handleResponse<OrganizationView>(res);
}

export async function updateOrganizationName(
	name: string,
): Promise<OrganizationView> {
	const res = await apiFetch(`${API_BASE}/organizations`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return handleResponse<OrganizationView>(res);
}

export async function requestOrgEmailOtp(newEmail: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/organizations/contact-email/otp`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ newEmail }),
	});
	await handleResponse(res);
}

export async function verifyOrgEmailOtp(
	otp: string,
): Promise<{ email: string }> {
	const res = await apiFetch(`${API_BASE}/organizations/contact-email/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ otp }),
	});
	return handleResponse<{ email: string }>(res);
}
