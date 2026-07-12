import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { verification } from "../db/schema";

// Expiry for the email-change OTP (10 minutes)
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

// Temporarily store the OTP and target address in the verification table (one row per identifier)
export async function storeEmailOtp(identifier: string, newEmail: string) {
	const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
	await db.delete(verification).where(eq(verification.identifier, identifier));
	await db.insert(verification).values({
		id: randomUUID(),
		identifier,
		value: `${otp}:${newEmail}`,
		expiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
	});
	return otp;
}

export type EmailOtpEvaluation =
	| { ok: true; newEmail: string; expired?: false }
	| { ok: false; error: string; expired: boolean };

export function evaluateEmailOtp(params: {
	value: string;
	expiresAt: Date;
	otp: string;
	now: number;
}): EmailOtpEvaluation {
	const { value, expiresAt, otp, now } = params;
	if (expiresAt.getTime() < now) {
		return {
			ok: false,
			error: "The verification code has expired",
			expired: true,
		};
	}
	const sep = value.indexOf(":");
	const savedOtp = value.slice(0, sep);
	// Email addresses can't contain a colon, but split on the first colon and treat the rest as the address
	const newEmail = value.slice(sep + 1);
	if (savedOtp !== otp) {
		return {
			ok: false,
			error: "The verification code is incorrect",
			expired: false,
		};
	}
	return { ok: true, newEmail };
}

// Verify the stored OTP. On success, return the target new address and consume (delete) the row
export async function consumeEmailOtp(
	identifier: string,
	otp: string,
): Promise<{ ok: true; newEmail: string } | { ok: false; error: string }> {
	const row = (
		await db
			.select()
			.from(verification)
			.where(eq(verification.identifier, identifier))
			.limit(1)
	)[0];
	if (!row) return { ok: false, error: "Verification code not found" };

	const result = evaluateEmailOtp({
		value: row.value,
		expiresAt: row.expiresAt,
		otp,
		now: Date.now(),
	});
	// The row is consumed on both expiry and a successful match (kept only on mismatch, for retry)
	if (result.ok || result.expired) {
		await db
			.delete(verification)
			.where(eq(verification.identifier, identifier));
	}
	if (!result.ok) return { ok: false, error: result.error };
	return { ok: true, newEmail: result.newEmail };
}
