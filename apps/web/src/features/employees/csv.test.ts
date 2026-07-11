import { describe, expect, it } from "vitest";
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
	it("ヘッダーと行を出力し、BOMを先頭に付ける", () => {
		const csv = employeesToCsv([emp({})]);
		expect(csv.charCodeAt(0)).toBe(0xfeff);
		const lines = csv.slice(1).split("\r\n");
		expect(lines[0]).toBe(
			"Employee Code,Last Name,First Name,Avatar Color,Status,Tag1,Tag2,Tag3,Tag4,Tag5,Tag6,Tag7,Tag8,Tag9,Tag10",
		);
		expect(lines[1].startsWith("EMP-001,山田,太郎,#2f8fd6,Active,")).toBe(true);
	});

	it("タグは先頭10個まで出力する", () => {
		const tags = Array.from({ length: 12 }, (_, i) => ({
			id: `t${i}`,
			name: `tag${i}`,
		}));
		const csv = employeesToCsv([emp({ tags })]);
		expect(csv).toContain("tag9");
		expect(csv).not.toContain("tag10");
	});

	it("カンマや引用符を含む値をエスケープする", () => {
		const csv = employeesToCsv([emp({ tags: [{ id: "t", name: 'a,"b' }] })]);
		expect(csv).toContain('"a,""b"');
	});

	it("無効な従業員は状態を無効として出力する", () => {
		const csv = employeesToCsv([emp({ isActive: false })]);
		expect(csv).toContain(",Inactive,");
	});
});

describe("parseEmployeesCsv", () => {
	it("往復して元の値を復元できる", () => {
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

	it("クォート内のカンマ・改行を1セルとして扱う", () => {
		const csv = 'ヘッダー\r\nE1,山,田,#2f8fd6,有効,"a,b",\n';
		const parsed = parseEmployeesCsv(csv);
		expect(parsed[0].tagNames).toEqual(["a,b"]);
	});

	it("空行は無視する", () => {
		const csv = "ヘッダー\r\nE1,山,田,#2f8fd6,有効\r\n\r\n";
		expect(parseEmployeesCsv(csv)).toHaveLength(1);
	});

	it("11列目以降にタグ値があると超過フラグを立てる", () => {
		const header = "ヘッダー";
		const tags = Array.from({ length: 11 }, (_, i) => `t${i}`).join(",");
		const csv = `${header}\r\nE1,山,田,#2f8fd6,有効,${tags}`;
		const parsed = parseEmployeesCsv(csv);
		expect(parsed[0].hasExcessTags).toBe(true);
		expect(parsed[0].tagNames).toHaveLength(10);
	});
});
