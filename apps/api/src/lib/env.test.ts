import { describe, expect, it } from "vitest";
import { resolveIsLocal } from "./env";

describe("resolveIsLocal", () => {
	it("is true only for local", () => {
		expect(resolveIsLocal("local")).toBe(true);
	});

	it("is false for prod, dev and stg", () => {
		expect(resolveIsLocal("prod")).toBe(false);
		expect(resolveIsLocal("dev")).toBe(false);
		expect(resolveIsLocal("stg")).toBe(false);
	});

	it("falls back to false when unset", () => {
		expect(resolveIsLocal(undefined)).toBe(false);
	});
});
