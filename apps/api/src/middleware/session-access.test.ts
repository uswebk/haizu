import { describe, expect, it } from "vitest";
import { evaluateSessionAccess } from "./session-access";

describe("evaluateSessionAccess", () => {
	it("blocks a deactivated user with 403", () => {
		expect(
			evaluateSessionAccess({ isActive: false, emailVerified: true }),
		).toEqual({ ok: false, status: 403, message: "This account is disabled" });
	});

	it("blocks a user with an unverified email with 403", () => {
		expect(
			evaluateSessionAccess({ isActive: true, emailVerified: false }),
		).toEqual({
			ok: false,
			status: 403,
			message: "Email verification required",
		});
	});

	it("lets an active, verified user through", () => {
		expect(
			evaluateSessionAccess({ isActive: true, emailVerified: true }),
		).toEqual({ ok: true });
	});

	it("reports deactivation ahead of an unverified email", () => {
		// A deactivated account returns "inactive" regardless of verification state
		expect(
			evaluateSessionAccess({ isActive: false, emailVerified: false }),
		).toEqual({ ok: false, status: 403, message: "This account is disabled" });
	});
});
