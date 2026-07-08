import type { Role } from "@haiz/shared";
import type { MemberRow } from "#/features/members/types";
import { API_BASE, apiFetch } from ".";

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

export const memberKeys = {
	all: ["members"] as const,
};

export async function fetchMembers(): Promise<MemberRow[]> {
	const res = await apiFetch(`${API_BASE}/members`);
	const data = await handleResponse<{ members: MemberRow[] }>(res);
	return data.members;
}

export type InviteMemberInput = {
	lastName: string;
	firstName: string;
	email: string;
	role: Role;
	siteIds: string[];
};

export async function inviteMember(
	input: InviteMemberInput,
): Promise<MemberRow> {
	const res = await apiFetch(`${API_BASE}/members/invite`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export type UpdateMemberInput = {
	role: Role;
	siteIds: string[];
	isActive: boolean;
};

export async function updateMember(
	id: string,
	input: UpdateMemberInput,
): Promise<MemberRow> {
	const res = await apiFetch(`${API_BASE}/members/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export async function cancelInvitation(id: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/members/invitations/${id}`, {
		method: "DELETE",
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
}
