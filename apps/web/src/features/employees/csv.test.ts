import { describe, expect, it } from "vitest";
import i18n from "#/i18n/config";
import { employeesToCsv, parseEmployeesCsv } from "./csv";
import type { EmployeeRow } from "./types";

function emp(overrides: Partial<EmployeeRow>): EmployeeRow {
	return {
		id: "id",
		code: "EMP-001",
		lastName: "山田",
		firstName: "太郎",
		avatarColor: "#2f8fd6",
		tags: [],
		isActive: true,
		...overrides,
	};
}

describe("employeesToCsv", () => {
	it("outputs the header and rows with a leading BOM", () => {
		const csv = employeesToCsv([emp({})]);
		expect(csv.charCodeAt(0)).toBe(0xfeff);
		const lines = csv.slice(1).split("\r\n");
		expect(lines[0]).toBe(
			"Employee Code,Last Name,First Name,Avatar Color,Status,Tag1,Tag2,Tag3,Tag4,Tag5,Tag6,Tag7,Tag8,Tag9,Tag10",
		);
		expect(lines[1].startsWith("EMP-001,山田,太郎,#2f8fd6,Active,")).toBe(true);
	});

	it("outputs only the first 10 tags", () => {
		const tags = Array.from({ length: 12 }, (_, i) => ({
			id: `t${i}`,
			name: `tag${i}`,
		}));
		const csv = employeesToCsv([emp({ tags })]);
		expect(csv).toContain("tag9");
		expect(csv).not.toContain("tag10");
	});

	it("escapes values containing commas or quotes", () => {
		const csv = employeesToCsv([emp({ tags: [{ id: "t", name: 'a,"b' }] })]);
		expect(csv).toContain('"a,""b"');
	});

	it("outputs Inactive status for inactive employees", () => {
		const csv = employeesToCsv([emp({ isActive: false })]);
		expect(csv).toContain(",Inactive,");
	});

	it("outputs headers in the currently selected language", async () => {
		await i18n.changeLanguage("ja");
		try {
			const csv = employeesToCsv([emp({})]);
			const lines = csv.slice(1).split("\r\n");
			expect(lines[0]).toBe(
				"従業員コード,姓,名,アバターカラー,ステータス,タグ1,タグ2,タグ3,タグ4,タグ5,タグ6,タグ7,タグ8,タグ9,タグ10",
			);
		} finally {
			await i18n.changeLanguage("en");
		}
	});
});

describe("parseEmployeesCsv", () => {
	it("round-trips the original values", () => {
		const csv = employeesToCsv([
			emp({ code: "E1", tags: [{ id: "t", name: "リーダー" }] }),
		]);
		const parsed = parseEmployeesCsv(csv);
		expect(parsed).toHaveLength(1);
		expect(parsed[0]).toMatchObject({
			code: "E1",
			lastName: "山田",
			firstName: "太郎",
			avatarColor: "#2f8fd6",
			isActive: true,
			tagNames: ["リーダー"],
			hasExcessTags: false,
		});
	});

	it("treats commas and newlines inside quotes as a single cell", () => {
		const csv = 'ヘッダー\r\nE1,山,田,#2f8fd6,有効,"a,b",\n';
		const parsed = parseEmployeesCsv(csv);
		expect(parsed[0].tagNames).toEqual(["a,b"]);
	});

	it("ignores empty lines", () => {
		const csv = "ヘッダー\r\nE1,山,田,#2f8fd6,有効\r\n\r\n";
		expect(parseEmployeesCsv(csv)).toHaveLength(1);
	});

	it("sets the excess flag when column 11+ has tag values", () => {
		const header = "ヘッダー";
		const tags = Array.from({ length: 11 }, (_, i) => `t${i}`).join(",");
		const csv = `${header}\r\nE1,山,田,#2f8fd6,有効,${tags}`;
		const parsed = parseEmployeesCsv(csv);
		expect(parsed[0].hasExcessTags).toBe(true);
		expect(parsed[0].tagNames).toHaveLength(10);
	});
});
