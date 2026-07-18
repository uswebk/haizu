import { describe, expect, it } from "vitest";
import {
	evaluateOrgPermission,
	evaluateSitePermission,
	isWriteMethod,
} from "./require-permission";

describe("isWriteMethod", () => {
	it("returns true for write methods", () => {
		expect(isWriteMethod("POST")).toBe(true);
		expect(isWriteMethod("PUT")).toBe(true);
		expect(isWriteMethod("PATCH")).toBe(true);
		expect(isWriteMethod("DELETE")).toBe(true);
	});

	it("returns false for read methods", () => {
		expect(isWriteMethod("GET")).toBe(false);
		expect(isWriteMethod("HEAD")).toBe(false);
	});

	it("is case-insensitive", () => {
		expect(isWriteMethod("post")).toBe(true);
		expect(isWriteMethod("get")).toBe(false);
	});
});

// The decision itself is fully covered by permissions.test. Here we only check that allow/deny
// maps to the expected result-object shape.
describe("evaluateOrgPermission", () => {
	it("returns ok for an allowed role", () => {
		expect(evaluateOrgPermission("admin", "org:write")).toEqual({ ok: true });
	});

	it("returns a 403 result for a denied role", () => {
		expect(evaluateOrgPermission("member", "org:write")).toEqual({
			ok: false,
			status: 403,
			message: "You don't have permission to perform this action",
		});
	});
});

describe("evaluateSitePermission", () => {
	it("returns ok for an allowed role", () => {
		expect(evaluateSitePermission("site_admin", "area:write")).toEqual({
			ok: true,
		});
	});

	it("returns a 403 result for a denied role", () => {
		expect(evaluateSitePermission("viewer", "area:write")).toEqual({
			ok: false,
			status: 403,
			message: "You don't have permission to perform this action",
		});
	});
});
