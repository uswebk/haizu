import { describe, expect, it } from "vitest";
import { evaluateEmailOtp } from "./email-otp";

const NOW = new Date("2026-07-11T00:00:00Z").getTime();

describe("evaluateEmailOtp", () => {
	it("期限切れは expired=true でエラーを返す", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW - 1),
				otp: "123456",
				now: NOW,
			}),
		).toEqual({
			ok: false,
			error: "確認コードの有効期限が切れました",
			expired: true,
		});
	});

	it("OTP不一致は expired=false でエラーを返す", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW + 1000),
				otp: "000000",
				now: NOW,
			}),
		).toEqual({
			ok: false,
			error: "確認コードが正しくありません",
			expired: false,
		});
	});

	it("一致すれば新メールアドレスを返す", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW + 1000),
				otp: "123456",
				now: NOW,
			}),
		).toEqual({ ok: true, newEmail: "new@example.com" });
	});

	it("値に複数のコロンがあっても最初のコロンで分割する", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:a:b@example.com",
				expiresAt: new Date(NOW + 1000),
				otp: "123456",
				now: NOW,
			}),
		).toEqual({ ok: true, newEmail: "a:b@example.com" });
	});
});
