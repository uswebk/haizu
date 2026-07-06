import { describe, expect, it } from "vitest";
import { evaluateSessionAccess } from "./session-access";

describe("evaluateSessionAccess", () => {
	it("無効化ユーザーは403で遮断する", () => {
		expect(
			evaluateSessionAccess({ isActive: false, emailVerified: true }),
		).toEqual({ ok: false, status: 403, message: "このアカウントは無効です" });
	});

	it("メール未確認ユーザーは403で遮断する", () => {
		expect(
			evaluateSessionAccess({ isActive: true, emailVerified: false }),
		).toEqual({
			ok: false,
			status: 403,
			message: "メールアドレスの確認が必要です",
		});
	});

	it("有効かつ確認済みユーザーは通過する", () => {
		expect(
			evaluateSessionAccess({ isActive: true, emailVerified: true }),
		).toEqual({ ok: true });
	});

	it("無効化を未確認より優先して判定する", () => {
		// 無効化アカウントは確認状態に関わらず「無効です」を返す
		expect(
			evaluateSessionAccess({ isActive: false, emailVerified: false }),
		).toEqual({ ok: false, status: 403, message: "このアカウントは無効です" });
	});
});
