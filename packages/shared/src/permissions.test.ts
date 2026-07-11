import { describe, expect, it } from "vitest";
import {
	canAccessScreen,
	canOrg,
	canSite,
	displayRole,
	effectiveSiteRole,
	landingScreen,
} from "./permissions";

describe("effectiveSiteRole", () => {
	it("admin は所属が無く(null)ても全拠点で site_admin として振る舞う", () => {
		expect(effectiveSiteRole("admin", null)).toBe("site_admin");
		expect(effectiveSiteRole("admin", "viewer")).toBe("site_admin");
	});

	it("member は拠点ロールをそのまま返す", () => {
		expect(effectiveSiteRole("member", "site_admin")).toBe("site_admin");
		expect(effectiveSiteRole("member", "general")).toBe("general");
		expect(effectiveSiteRole("member", "viewer")).toBe("viewer");
		expect(effectiveSiteRole("member", null)).toBeNull();
	});
});

describe("canOrg", () => {
	it("admin は組織スコープの操作をすべて許可される", () => {
		expect(canOrg("admin", "org:write")).toBe(true);
		expect(canOrg("admin", "site:manage")).toBe(true);
	});

	it("member は組織スコープの操作をすべて拒否される", () => {
		expect(canOrg("member", "org:write")).toBe(false);
		expect(canOrg("member", "site:manage")).toBe(false);
	});
});

describe("canSite", () => {
	it("拠点ロールが null なら常に false", () => {
		expect(canSite(null, "member:manage")).toBe(false);
		expect(canSite(null, "site_data:read")).toBe(false);
	});

	it("site_admin は書き込み・読み取りをすべて許可される", () => {
		expect(canSite("site_admin", "member:manage")).toBe(true);
		expect(canSite("site_admin", "area:write")).toBe(true);
		expect(canSite("site_admin", "assignment_history:read")).toBe(true);
		expect(canSite("site_admin", "site_data:read")).toBe(true);
	});

	it("general は履歴読取と拠点データ読取のみ許可、書き込みは拒否", () => {
		expect(canSite("general", "assignment_history:read")).toBe(true);
		expect(canSite("general", "site_data:read")).toBe(true);
		expect(canSite("general", "member:manage")).toBe(false);
		expect(canSite("general", "area:write")).toBe(false);
	});

	it("viewer は拠点データ読取のみ、履歴読取も拒否", () => {
		expect(canSite("viewer", "site_data:read")).toBe(true);
		expect(canSite("viewer", "assignment_history:read")).toBe(false);
		expect(canSite("viewer", "area:write")).toBe(false);
	});
});

describe("canAccessScreen", () => {
	it("account はどのロール(null 含む)でも常にアクセス可", () => {
		expect(canAccessScreen("member", null, "account")).toBe(true);
		expect(canAccessScreen("admin", "site_admin", "account")).toBe(true);
	});

	it("組織スコープの画面は admin のみ", () => {
		expect(canAccessScreen("admin", null, "sites")).toBe(true);
		expect(canAccessScreen("admin", null, "organization-settings")).toBe(true);
		expect(canAccessScreen("member", "site_admin", "sites")).toBe(false);
		expect(
			canAccessScreen("member", "site_admin", "organization-settings"),
		).toBe(false);
	});

	it("admin は拠点所属が無く(null)ても拠点スコープ画面に到達できる", () => {
		expect(canAccessScreen("admin", null, "editor")).toBe(true);
		expect(canAccessScreen("admin", null, "members")).toBe(true);
	});

	it("member+viewer は viewer 画面のみ、編集系は不可", () => {
		expect(canAccessScreen("member", "viewer", "viewer")).toBe(true);
		expect(canAccessScreen("member", "viewer", "editor")).toBe(false);
		expect(canAccessScreen("member", "viewer", "home")).toBe(false);
	});

	it("member+general は home/history 可、編集系は不可", () => {
		expect(canAccessScreen("member", "general", "home")).toBe(true);
		expect(canAccessScreen("member", "general", "history")).toBe(true);
		expect(canAccessScreen("member", "general", "editor")).toBe(false);
	});

	it("拠点所属の無い member は拠点スコープ画面にすべて到達できない", () => {
		expect(canAccessScreen("member", null, "viewer")).toBe(false);
		expect(canAccessScreen("member", null, "home")).toBe(false);
		expect(canAccessScreen("member", null, "editor")).toBe(false);
	});
});

describe("landingScreen", () => {
	it("home を見られるロールは home へ", () => {
		expect(landingScreen("admin", null)).toBe("home");
		expect(landingScreen("member", "site_admin")).toBe("home");
		expect(landingScreen("member", "general")).toBe("home");
	});

	it("home 不可だが viewer 可のロールは viewer へ", () => {
		expect(landingScreen("member", "viewer")).toBe("viewer");
	});

	it("拠点データを一切見られない member は account へ", () => {
		expect(landingScreen("member", null)).toBe("account");
	});
});

describe("displayRole", () => {
	it("admin は拠点ロールに関わらず admin", () => {
		expect(displayRole("admin", null)).toBe("admin");
		expect(displayRole("admin", "viewer")).toBe("admin");
	});

	it("member は拠点ロールをそのまま(null 含む)返す", () => {
		expect(displayRole("member", "general")).toBe("general");
		expect(displayRole("member", null)).toBeNull();
	});
});
