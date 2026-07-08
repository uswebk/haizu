import type { Role } from "@haizu/shared";
import { API_BASE } from ".";

async function extractError(res: Response, fallback: string): Promise<string> {
	const body = await res.json().catch(() => null);
	return body &&
		typeof body === "object" &&
		"error" in body &&
		typeof body.error === "string"
		? body.error
		: fallback;
}

export type InvitationPreview = {
	lastName: string;
	firstName: string;
	email: string;
	role: Role;
};

export async function fetchInvitationPreview(
	token: string,
): Promise<InvitationPreview> {
	const res = await fetch(
		`${API_BASE}/invitations/${encodeURIComponent(token)}`,
	);
	if (!res.ok) {
		throw new Error(await extractError(res, "招待が見つかりません"));
	}
	return res.json();
}

export async function acceptInvitation(
	token: string,
	password: string,
): Promise<void> {
	const res = await fetch(
		`${API_BASE}/invitations/${encodeURIComponent(token)}/accept`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password }),
		},
	);
	if (!res.ok) {
		throw new Error(await extractError(res, "招待の受け入れに失敗しました"));
	}
}
