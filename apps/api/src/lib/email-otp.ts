import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { verification } from "../db/schema";

// メール変更OTPの有効期限（10分）
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

// OTPと対象アドレスを verification テーブルに一時保存する（identifier ごとに1件）
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
			error: "確認コードの有効期限が切れました",
			expired: true,
		};
	}
	const sep = value.indexOf(":");
	const savedOtp = value.slice(0, sep);
	// メールアドレスにコロンは含まれ得ないが、最初のコロンで分割し残り全体をアドレスとする
	const newEmail = value.slice(sep + 1);
	if (savedOtp !== otp) {
		return { ok: false, error: "確認コードが正しくありません", expired: false };
	}
	return { ok: true, newEmail };
}

// 保存済みOTPを検証する。成功時は対象の新アドレスを返し、行は消費（削除）する
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
	if (!row) return { ok: false, error: "確認コードが見つかりません" };

	const result = evaluateEmailOtp({
		value: row.value,
		expiresAt: row.expiresAt,
		otp,
		now: Date.now(),
	});
	// 期限切れ・照合成功のいずれも行は消費する（不一致のときだけ再試行のため残す）
	if (result.ok || result.expired) {
		await db
			.delete(verification)
			.where(eq(verification.identifier, identifier));
	}
	if (!result.ok) return { ok: false, error: result.error };
	return { ok: true, newEmail: result.newEmail };
}
