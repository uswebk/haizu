import type { SignUpInput } from "@haizu/shared";
import { API_BASE } from ".";

// Custom sign-up that also creates an organization from the company name (calls the API-side wrapper, not Better Auth's standard signUp).
export async function signUp(input: SignUpInput): Promise<void> {
	const res = await fetch(`${API_BASE}/auth/sign-up`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
		credentials: "include",
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		const message =
			body && typeof body === "object" && ("error" in body || "message" in body)
				? String(
						(body as { error?: string; message?: string }).error ??
							(body as { message?: string }).message,
					)
				: "サインアップに失敗しました";
		throw new Error(message);
	}
}
