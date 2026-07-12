import { describe, expect, it } from "vitest";
import { membersTemplateCsv, parseMembersCsv } from "./csv";

describe("parseMembersCsv", () => {
	it("skips the header row and trims cells", () => {
		const rows = parseMembersCsv(
			"姓,名,メールアドレス\r\n山田, 太郎 ,taro@example.com\r\n鈴木,花子,hanako@example.com",
		);
		expect(rows).toEqual([
			{
				line: 1,
				lastName: "山田",
				firstName: "太郎",
				email: "taro@example.com",
			},
			{
				line: 2,
				lastName: "鈴木",
				firstName: "花子",
				email: "hanako@example.com",
			},
		]);
	});

	it("returns empty for a header-only or empty file", () => {
		expect(parseMembersCsv("")).toEqual([]);
		expect(parseMembersCsv("姓,名,メールアドレス\r\n")).toEqual([]);
	});

	it("keeps missing cells as empty strings", () => {
		const rows = parseMembersCsv("h1,h2,h3\n山田");
		expect(rows[0]).toEqual({
			line: 1,
			lastName: "山田",
			firstName: "",
			email: "",
		});
	});

	it("handles a BOM and quoted cells", () => {
		const rows = parseMembersCsv('﻿h1,h2,h3\n"山田, 一郎",太郎,a@example.com');
		expect(rows[0]?.lastName).toBe("山田, 一郎");
	});
});

describe("membersTemplateCsv", () => {
	it("emits a BOM and a header row", () => {
		const csv = membersTemplateCsv();
		expect(csv.charCodeAt(0)).toBe(0xfeff);
		expect(parseMembersCsv(csv)).toHaveLength(1);
	});
});
