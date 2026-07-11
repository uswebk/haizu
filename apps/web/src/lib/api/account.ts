import { API_BASE, apiFetch, handleResponse } from ".";

// Login email change: send a verification code (OTP) to the new address
export async function requestEmailChangeOtp(newEmail: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/account/email/otp`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ newEmail }),
	});
	await handleResponse(res);
}

// Login email change: verify the code and finalize
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
