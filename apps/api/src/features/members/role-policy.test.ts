import { describe, expect, it } from "vitest";
import {
	assertSitesManageable,
	evaluateOrgRoleAssignment,
} from "./role-policy";

describe("evaluateOrgRoleAssignment", () => {
	it("rejects changing your own role", () => {
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

	it("allows a no-op update on yourself that keeps the same role", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "admin",
				isSelf: true,
				targetOrgRole: "admin",
				nextOrgRole: "admin",
			}),
		).toEqual({ ok: true });
	});

	it("forbids a site admin (member) from touching an existing admin", () => {
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

	it("forbids a site admin (member) from promoting to admin on invite (target=null)", () => {
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

	it("allows an admin to create another admin", () => {
		expect(
			evaluateOrgRoleAssignment({
				actorOrgRole: "admin",
				isSelf: false,
				targetOrgRole: null,
				nextOrgRole: "admin",
			}),
		).toEqual({ ok: true });
	});

	it("allows a site admin (member) to keep a member as a member", () => {
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
	it("allows target sites that are a subset of the manageable sites", () => {
		expect(assertSitesManageable(["s1", "s2", "s3"], ["s1", "s3"])).toEqual({
			ok: true,
		});
	});

	it("rejects a target list containing an unmanageable site", () => {
		expect(assertSitesManageable(["s1", "s2"], ["s1", "s9"])).toEqual({
			ok: false,
			status: 403,
			message: "Includes a site you can't set permissions for",
		});
	});

	it("allows an empty target site list", () => {
		expect(assertSitesManageable(["s1"], [])).toEqual({ ok: true });
	});

	it("rejects a non-empty target list when no sites are manageable", () => {
		expect(assertSitesManageable([], ["s1"])).toEqual({
			ok: false,
			status: 403,
			message: "Includes a site you can't set permissions for",
		});
	});
});
