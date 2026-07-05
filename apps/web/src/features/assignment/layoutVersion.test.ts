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
	it("過去日は適用開始日が古いバージョンを解決する", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-08-01" });
		expect(resolveVersionForDate([v1, v2], "2026-06-15")).toEqual(v1);
	});

	it("適用開始日以降の日付は新しいバージョンを解決する", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-08-01" });
		expect(resolveVersionForDate([v1, v2], "2026-08-01")).toEqual(v2);
		expect(resolveVersionForDate([v1, v2], "2026-12-01")).toEqual(v2);
	});

	it("どのバージョンの適用開始日よりも前の日付はnullを返す", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1], "2026-01-01")).toBeNull();
	});

	it("下書き（未公開）は候補から除外される", () => {
		const draft = version({
			id: "draft",
			label: "v2",
			status: "draft",
			effectiveDate: "2026-01-01",
		});
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1, draft], "2026-06-01")).toEqual(v1);
	});

	it("同じ適用開始日の場合はバージョン番号が大きい方を優先する", () => {
		const v1 = version({ id: "v1", label: "v1", effectiveDate: "2026-04-01" });
		const v2 = version({ id: "v2", label: "v2", effectiveDate: "2026-04-01" });
		expect(resolveVersionForDate([v1, v2], "2026-04-01")).toEqual(v2);
	});
});
