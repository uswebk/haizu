import type { OrgRole } from "@haizu/shared";
import type { MemberRow, SiteRoleAssignment } from "#/features/members/types";
import { API_BASE, apiFetch, handleResponse } from ".";

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
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
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

export type BulkInviteInput = {
	members: { lastName: string; firstName: string; email: string }[];
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
};

export async function bulkInviteMembers(
	input: BulkInviteInput,
): Promise<{ created: number }> {
	const res = await apiFetch(`${API_BASE}/members/invite/bulk`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export type UpdateMemberInput = {
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
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
