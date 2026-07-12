import { describe, expect, it } from "vitest";
import {
	isUsableForDate,
	resolveCurrentVersion,
	resolveListedVersion,
	type VersionForResolution,
} from "./version";

function version(
	id: string,
	num: number,
	status: "draft" | "published",
	effectiveDate: string | null,
): VersionForResolution {
	return { id, version: num, status, effectiveDate };
}

describe("isUsableForDate", () => {
	it("accepts a published version whose effective date has arrived", () => {
		expect(
			isUsableForDate({ status: "published", effectiveDate: "2026-07-01" }, "2026-07-12"),
		).toBe(true);
		expect(
			isUsableForDate({ status: "published", effectiveDate: "2026-07-12" }, "2026-07-12"),
		).toBe(true);
	});

	it("rejects a draft, a future effective date, and a published version with no date", () => {
		expect(
			isUsableForDate({ status: "draft", effectiveDate: "2026-07-01" }, "2026-07-12"),
		).toBe(false);
		expect(
			isUsableForDate({ status: "published", effectiveDate: "2026-08-01" }, "2026-07-12"),
		).toBe(false);
		expect(
			isUsableForDate({ status: "published", effectiveDate: null }, "2026-07-12"),
		).toBe(false);
	});
});

describe("resolveCurrentVersion", () => {
	it("picks the newest effective date on or before the target date", () => {
		const versions = [
			version("v1", 1, "published", "2026-06-01"),
			version("v2", 2, "published", "2026-07-01"),
			version("v3", 3, "published", "2026-08-01"),
		];
		expect(resolveCurrentVersion(versions, "2026-07-12")?.id).toBe("v2");
	});

	it("breaks a tie on effective date with the larger version number", () => {
		const versions = [
			version("v2", 2, "published", "2026-07-01"),
			version("v3", 3, "published", "2026-07-01"),
		];
		expect(resolveCurrentVersion(versions, "2026-07-12")?.id).toBe("v3");
	});

	it("returns null when only drafts exist", () => {
		expect(
			resolveCurrentVersion([version("v1", 1, "draft", null)], "2026-07-12"),
		).toBeNull();
	});
});

describe("resolveListedVersion", () => {
	it("returns the applied version when there is one", () => {
		const versions = [
			version("v1", 1, "published", "2026-06-01"),
			version("v2", 2, "draft", null),
		];
		expect(resolveListedVersion(versions, "2026-07-12")?.id).toBe("v1");
	});

	it("falls back to a draft when nothing applies yet", () => {
		const versions = [version("v1", 1, "draft", null)];
		expect(resolveListedVersion(versions, "2026-07-12")?.id).toBe("v1");
	});

	// Postgres sorts NULLS FIRST on a DESC order, so a dateless draft outranks a future published version
	it("prefers a dateless draft over a version whose effective date is still in the future", () => {
		const versions = [
			version("v1", 1, "published", "2026-08-01"),
			version("v2", 2, "draft", null),
		];
		expect(resolveListedVersion(versions, "2026-07-12")?.id).toBe("v2");
	});

	it("returns null for an area with no versions", () => {
		expect(resolveListedVersion([], "2026-07-12")).toBeNull();
	});
});
