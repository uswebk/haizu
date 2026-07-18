import { describe, expect, it } from "vitest";
import { evaluateEmailOtp } from "./email-otp";

const NOW = new Date("2026-07-11T00:00:00Z").getTime();

describe("evaluateEmailOtp", () => {
	it("returns an error with expired=true once the deadline has passed", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW - 1),
				otp: "123456",
				now: NOW,
			}),
		).toEqual({
			ok: false,
			error: "The verification code has expired",
			expired: true,
		});
	});

	it("returns an error with expired=false when the OTP does not match", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW + 1000),
				otp: "000000",
				now: NOW,
			}),
		).toEqual({
			ok: false,
			error: "The verification code is incorrect",
			expired: false,
		});
	});

	it("returns the new email address on a match", () => {
		expect(
			evaluateEmailOtp({
				value: "123456:new@example.com",
				expiresAt: new Date(NOW + 1000),
				otp: "123456",
				now: NOW,
			}),
		).toEqual({ ok: true, newEmail: "new@example.com" });
	});

	it("splits on the first colon even when the value contains several", () => {
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
