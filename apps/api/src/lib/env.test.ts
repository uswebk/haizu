import { describe, expect, it } from "vitest";
import { resolveIsLocal } from "./env";

describe("resolveIsLocal", () => {
	it("local のときのみ true", () => {
		expect(resolveIsLocal("local")).toBe(true);
	});

	it("prod / dev / stg は false", () => {
		expect(resolveIsLocal("prod")).toBe(false);
		expect(resolveIsLocal("dev")).toBe(false);
		expect(resolveIsLocal("stg")).toBe(false);
	});

	it("未設定(undefined)は安全側で false", () => {
		expect(resolveIsLocal(undefined)).toBe(false);
	});
});
