import { describe, expect, it } from "vitest";
import {
	assertSitesManageable,
	evaluateOrgRoleAssignment,
} from "./member-role-policy";

describe("evaluateOrgRoleAssignment", () => {
	it("自身の権限を変更しようとすると拒否する", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "admin",
				isSelf: true,
				targetOrgRole: "admin",
				nextOrgRole: "member",
			}),
		).toEqual({
			ok: false,
			status: 403,
			message: "You can't change your own role",
		});
	});

	it("自身への no-op 更新(ロール据え置き)は許可する", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "admin",
				isSelf: true,
				targetOrgRole: "admin",
				nextOrgRole: "admin",
			}),
		).toEqual({ ok: true });
	});

	it("拠点管理者(member)は既存の管理者に手を出せない", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "member",
				isSelf: false,
				targetOrgRole: "admin",
				nextOrgRole: "member",
			}),
		).toEqual({
			ok: false,
			status: 403,
			message: "Site admins can't grant the admin role",
		});
	});

	it("拠点管理者(member)は管理者へ昇格させられない(招待: target=null)", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "member",
				isSelf: false,
				targetOrgRole: null,
				nextOrgRole: "admin",
			}),
		).toEqual({
			ok: false,
			status: 403,
			message: "Site admins can't grant the admin role",
		});
	});

	it("管理者は管理者を作成できる", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "admin",
				isSelf: false,
				targetOrgRole: null,
				nextOrgRole: "admin",
			}),
		).toEqual({ ok: true });
	});

	it("拠点管理者(member)が member を member のまま扱うのは許可する", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "member",
				isSelf: false,
				targetOrgRole: "member",
				nextOrgRole: "member",
			}),
		).toEqual({ ok: true });
	});
});

describe("assertSitesManageable", () => {
	it("対象拠点が管理可能拠点の部分集合なら許可する", () => {
		expect(assertSitesManageable(["s1", "s2", "s3"], ["s1", "s3"])).toEqual({
			ok: true,
		});
	});

	it("管理外の拠点が混入していると拒否する", () => {
		expect(assertSitesManageable(["s1", "s2"], ["s1", "s9"])).toEqual({
			ok: false,
			status: 403,
			message: "Includes a site you can't set permissions for",
		});
	});

	it("対象拠点が空なら許可する", () => {
		expect(assertSitesManageable(["s1"], [])).toEqual({ ok: true });
	});

	it("管理可能拠点が空で対象が非空なら拒否する", () => {
		expect(assertSitesManageable([], ["s1"])).toEqual({
			ok: false,
			status: 403,
			message: "Includes a site you can't set permissions for",
		});
	});
});
