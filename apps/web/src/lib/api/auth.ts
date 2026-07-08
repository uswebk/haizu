import type { SignUpInput } from "@haizu/shared";
import { API_BASE } from ".";

// 会社名→組織作成を伴うカスタムサインアップ（Better Auth 標準の signUp ではなく API 側のラッパを叩く）。
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
