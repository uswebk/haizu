import { describe, expect, it } from "vitest";
import type { ParsedEmployeeRow } from "./csv";
import { validateImport } from "./importValidation";
import type { EmployeeRow } from "./types";

function parsed(overrides: Partial<ParsedEmployeeRow>): ParsedEmployeeRow {
	return {
		line: 1,
		code: "E1",
		lastName: "山田",
		firstName: "太郎",
		avatarColor: "#2f8fd6",
		isActive: true,
		tagNames: [],
		hasExcessTags: false,
		...overrides,
	};
}

const tags = [
	{ id: "t1", name: "リーダー", employeeCount: 0 },
	{ id: "t2", name: "検査", employeeCount: 0 },
];

const existing: EmployeeRow[] = [
	{
		id: "x",
		code: "EXIST",
		lastName: "既",
		firstName: "存",
		avatarColor: "#000000",
		tags: [],
		isActive: true,
	},
];

describe("validateImport", () => {
	it("正常行はinputを生成しタグ名をidへ解決する", () => {
		const res = validateImport(
			[parsed({ tagNames: ["リーダー", "検査"] })],
			existing,
			tags,
		);
		expect(res.errorCount).toBe(0);
		expect(res.validCount).toBe(1);
		expect(res.rows[0].input).toMatchObject({
			code: "E1",
			tagIds: ["t1", "t2"],
		});
	});

	it("必須欠落をエラーにする", () => {
		const res = validateImport(
			[parsed({ code: "", lastName: "", firstName: "" })],
			[],
			tags,
		);
		expect(res.rows[0].errors).toContain("Employee code is empty");
		expect(res.rows[0].errors).toContain("Last name is empty");
		expect(res.rows[0].errors).toContain("First name is empty");
		expect(res.rows[0].input).toBeNull();
	});

	it("CSV内の社員番号重複を該当行すべてエラーにする", () => {
		const res = validateImport(
			[parsed({ line: 1, code: "DUP" }), parsed({ line: 2, code: "DUP" })],
			[],
			tags,
		);
		expect(res.errorCount).toBe(2);
		for (const r of res.rows) {
			expect(r.errors).toContain("Duplicate employee code within the CSV");
		}
	});

	it("既存従業員との重複をエラーにする", () => {
		const res = validateImport([parsed({ code: "EXIST" })], existing, tags);
		expect(res.rows[0].errors).toContain(
			"Employee code duplicates an existing employee",
		);
	});

	it("未登録タグをエラーにする", () => {
		const res = validateImport(
			[parsed({ tagNames: ["未知"] })],
			existing,
			tags,
		);
		expect(res.rows[0].errors[0]).toContain("Unregistered tags");
	});

	it("タグ超過をエラーにする", () => {
		const res = validateImport(
			[parsed({ hasExcessTags: true })],
			existing,
			tags,
		);
		expect(res.rows[0].errors).toContain("Up to 10 tags allowed");
	});

	it("不正なアバターカラーは既定色へ補完する", () => {
		const res = validateImport([parsed({ avatarColor: "" })], [], tags);
		expect(res.rows[0].input?.avatarColor).toBe("#2f8fd6");
	});
});
