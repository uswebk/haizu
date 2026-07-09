import { API_BASE, apiFetch, handleResponse } from ".";

// ログインメール変更: 新アドレス宛に確認コード（OTP）を送信する
export async function requestEmailChangeOtp(newEmail: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/account/email/otp`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ newEmail }),
	});
	await handleResponse(res);
}

// ログインメール変更: 確認コードを検証し確定する
export async function verifyEmailChangeOtp(
	otp: string,
): Promise<{ email: string }> {
	const res = await apiFetch(`${API_BASE}/account/email/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ otp }),
	});
	return handleResponse<{ email: string }>(res);
}
