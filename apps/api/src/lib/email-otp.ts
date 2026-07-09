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
	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(verification).where(eq(verification.identifier, identifier));
		return { ok: false, error: "確認コードの有効期限が切れました" };
	}
	const sep = row.value.indexOf(":");
	const savedOtp = row.value.slice(0, sep);
	const newEmail = row.value.slice(sep + 1);
	if (savedOtp !== otp) return { ok: false, error: "確認コードが正しくありません" };
	await db.delete(verification).where(eq(verification.identifier, identifier));
	return { ok: true, newEmail };
}
