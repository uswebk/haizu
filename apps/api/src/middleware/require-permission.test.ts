import { describe, expect, it } from "vitest";
import {
	evaluateOrgPermission,
	evaluateSitePermission,
	isWriteMethod,
} from "./require-permission";

describe("isWriteMethod", () => {
	it("書き込みメソッドは true", () => {
		expect(isWriteMethod("POST")).toBe(true);
		expect(isWriteMethod("PUT")).toBe(true);
		expect(isWriteMethod("PATCH")).toBe(true);
		expect(isWriteMethod("DELETE")).toBe(true);
	});

	it("読み取りメソッドは false", () => {
		expect(isWriteMethod("GET")).toBe(false);
		expect(isWriteMethod("HEAD")).toBe(false);
	});

	it("大小文字を区別しない", () => {
		expect(isWriteMethod("post")).toBe(true);
		expect(isWriteMethod("get")).toBe(false);
	});
});

// The decision itself is fully covered by permissions.test. Here we only check that allow/deny
// maps to the expected result-object shape.
describe("evaluateOrgPermission", () => {
	it("許可されるロールは ok を返す", () => {
		expect(evaluateOrgPermission("admin", "org:write")).toEqual({ ok: true });
	});

	it("拒否されるロールは 403 の結果を返す", () => {
		expect(evaluateOrgPermission("member", "org:write")).toEqual({
			ok: false,
			status: 403,
			message: "この操作を行う権限がありません",
		});
	});
});

describe("evaluateSitePermission", () => {
	it("許可されるロールは ok を返す", () => {
		expect(evaluateSitePermission("site_admin", "area:write")).toEqual({
			ok: true,
		});
	});

	it("拒否されるロールは 403 の結果を返す", () => {
		expect(evaluateSitePermission("viewer", "area:write")).toEqual({
			ok: false,
			status: 403,
			message: "この操作を行う権限がありません",
		});
	});
});
