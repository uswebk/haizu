import { describe, expect, it } from "vitest";
import type { ParsedMemberRow } from "./csv";
import { validateInvites } from "./importValidation";
import type { MemberRow } from "./types";

function parsed(
	line: number,
	lastName: string,
	firstName: string,
	email: string,
): ParsedMemberRow {
	return { line, lastName, firstName, email };
}

function member(email: string): MemberRow {
	return {
		id: `id-${email}`,
		kind: "user",
		name: "既存",
		email,
		orgRole: "member",
		siteRoles: [],
		allSites: false,
		status: "active",
	};
}

describe("validateInvites", () => {
	it("accepts valid rows and builds the invite input", () => {
		const preview = validateInvites(
			[parsed(1, "山田", "太郎", "taro@example.com")],
			[],
		);
		expect(preview.validCount).toBe(1);
		expect(preview.errorCount).toBe(0);
		expect(preview.rows[0]?.input).toEqual({
			lastName: "山田",
			firstName: "太郎",
			email: "taro@example.com",
		});
		expect(preview.rows[0]?.name).toBe("山田 太郎");
	});

	it("flags a missing last name and a missing email", () => {
		const preview = validateInvites([parsed(1, "", "太郎", "")], []);
		expect(preview.rows[0]?.errors).toHaveLength(2);
		expect(preview.rows[0]?.input).toBeNull();
		expect(preview.validCount).toBe(0);
	});

	it("flags a malformed email", () => {
		const preview = validateInvites([parsed(1, "山田", "", "taro@")], []);
		expect(preview.rows[0]?.errors).toHaveLength(1);
		expect(preview.errorCount).toBe(1);
	});

	it("flags every row of an email duplicated within the CSV, ignoring case", () => {
		const preview = validateInvites(
			[
				parsed(1, "山田", "太郎", "taro@example.com"),
				parsed(2, "鈴木", "花子", "TARO@example.com"),
			],
			[],
		);
		expect(preview.errorCount).toBe(2);
	});

	it("flags an email that already belongs to a member or invitation", () => {
		const preview = validateInvites(
			[parsed(1, "山田", "太郎", "Taro@example.com")],
			[member("taro@example.com")],
		);
		expect(preview.rows[0]?.errors).toHaveLength(1);
		expect(preview.validCount).toBe(0);
	});

	it("counts valid and error rows independently so valid rows still import", () => {
		const preview = validateInvites(
			[parsed(1, "山田", "太郎", "taro@example.com"), parsed(2, "", "", "bad")],
			[],
		);
		expect(preview.validCount).toBe(1);
		expect(preview.errorCount).toBe(1);
	});
});
