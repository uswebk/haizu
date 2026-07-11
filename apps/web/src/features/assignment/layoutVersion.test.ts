import { describe, expect, it } from "vitest";
import {
	UNPUBLISHED_EFFECTIVE_DATE,
	type VersionState,
} from "#/features/editor/types";
import { resolveVersionForDate } from "./layoutVersion";

function version(overrides: Partial<VersionState>): VersionState {
	return {
		id: overrides.label ?? "id",
		label: "v1",
		status: "published",
		effectiveDate: UNPUBLISHED_EFFECTIVE_DATE,
		planImageUrl: null,
		planImageName: null,
		planImageScale: 1,
		isActive: false,
		isCurrent: false,
		hasAssignments: false,
		...overrides,
	};
}

describe("resolveVersionForDate", () => {
	it("resolves the version with the older effective date for a past date", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-08-01" });
		expect(resolveVersionForDate([v1, v2], "2026-06-15")).toEqual(v1);
	});

	it("resolves the newer version for a date on or after its effective date", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-08-01" });
		expect(resolveVersionForDate([v1, v2], "2026-08-01")).toEqual(v2);
		expect(resolveVersionForDate([v1, v2], "2026-12-01")).toEqual(v2);
	});

	it("returns null for a date earlier than every version's effective date", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1], "2026-01-01")).toBeNull();
	});

	it("excludes draft (unpublished) versions from the candidates", () => {
		const draft = version({
			id: "draft",
			label: "v2",
			status: "draft",
			effectiveDate: "2026-01-01",
		});
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1, draft], "2026-06-01")).toEqual(v1);
	});

	it("prefers the higher version number when effective dates are equal", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1, v2], "2026-04-01")).toEqual(v2);
	});
});
