import { beforeEach, describe, expect, it } from "vitest";
import { authedRequest, signUpOrg, type TestUser } from "../helpers/auth";
import { resetDb } from "../helpers/db";
import { createArea, createLayoutSpecVersion, createSite } from "../helpers/factory";

// GET /areas?date= の一覧と GET /areas/:id の適用バージョン解決
// (resolveCurrentVersion / resolveListedVersion を DB 越しに検証)と publish/unpublish フロー。
describe("layout area version resolution and publishing", () => {
	let admin: TestUser;
	let siteId: string;

	beforeEach(async () => {
		await resetDb();
		admin = await signUpOrg();
		siteId = (await createSite(admin.organizationId)).id;
	});

	function get(path: string) {
		return authedRequest(path, { cookie: admin.cookie, siteId });
	}

	it("lists an area with only a draft as a draft", async () => {
		const area = await createArea(siteId);
		await createLayoutSpecVersion(area.id, { status: "draft" });

		const res = await get("/areas?date=2026-07-17");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.areas).toHaveLength(1);
		expect(json.areas[0].currentStatus).toBe("draft");
		expect(json.areas[0].currentVersion).toBe("v1");
	});

	it("picks a published version whose effectiveDate is on or before the target date as current", async () => {
		const area = await createArea(siteId);
		await createLayoutSpecVersion(area.id, {
			status: "published",
			effectiveDate: "2026-07-01",
			publishedAt: new Date(),
		});

		const res = await get(`/areas/${area.id}`);
		const json = await res.json();
		expect(json.versions).toHaveLength(1);
		expect(json.versions[0].isCurrent).toBe(true);
	});

	it("does not pick a published version whose effectiveDate is in the future", async () => {
		const area = await createArea(siteId);
		await createLayoutSpecVersion(area.id, {
			status: "published",
			effectiveDate: "2999-01-01",
			publishedAt: new Date(),
		});

		const res = await get(`/areas/${area.id}`);
		const json = await res.json();
		expect(json.versions[0].isCurrent).toBe(false);
		// current がないので最新版がエディタのデフォルト表示になる
		expect(json.versions[0].isActive).toBe(true);
	});

	it("picks the latest effectiveDate among published versions, breaking ties with the larger version number", async () => {
		const area = await createArea(siteId);
		await createLayoutSpecVersion(area.id, {
			version: 1,
			status: "published",
			effectiveDate: "2026-01-01",
			publishedAt: new Date(),
		});
		const v2 = await createLayoutSpecVersion(area.id, {
			version: 2,
			status: "published",
			effectiveDate: "2026-07-01",
			publishedAt: new Date(),
		});
		const v3 = await createLayoutSpecVersion(area.id, {
			version: 3,
			status: "published",
			effectiveDate: "2026-07-01",
			publishedAt: new Date(),
		});

		const res = await get(`/areas/${area.id}`);
		const json = await res.json();
		const current = json.versions.find(
			(v: { isCurrent: boolean }) => v.isCurrent,
		);
		expect(current.id).toBe(v3.id);
		expect(
			json.versions.find((v: { id: string }) => v.id === v2.id).isCurrent,
		).toBe(false);
	});

	it("sets published and effectiveDate on publish and switches current in the list", async () => {
		const area = await createArea(siteId);
		const version = await createLayoutSpecVersion(area.id, { status: "draft" });

		const res = await authedRequest(
			`/areas/${area.id}/versions/${version.id}/publish`,
			{
				cookie: admin.cookie,
				siteId,
				method: "POST",
				body: { effectiveDate: "2026-07-01" },
			},
		);
		expect(res.status).toBe(200);

		const list = await get("/areas?date=2026-07-17");
		const json = await list.json();
		expect(json.areas[0].currentStatus).toBe("published");
	});

	it("returns 404 when publishing a version of another organization's area", async () => {
		const orgB = await signUpOrg("組織B");
		const siteB = await createSite(orgB.organizationId);
		const areaB = await createArea(siteB.id);
		const versionB = await createLayoutSpecVersion(areaB.id);

		// 組織Aの admin が自サイトのスコープで組織Bのエリアを指定しても areaGuard が 404 を返す
		const res = await authedRequest(
			`/areas/${areaB.id}/versions/${versionB.id}/publish`,
			{
				cookie: admin.cookie,
				siteId,
				method: "POST",
				body: { effectiveDate: "2026-07-01" },
			},
		);
		expect(res.status).toBe(404);
	});

	it("returns 404 from versionGuard when the versionId belongs to a different area", async () => {
		const areaA = await createArea(siteId);
		await createLayoutSpecVersion(areaA.id);
		const areaB = await createArea(siteId);
		const versionB = await createLayoutSpecVersion(areaB.id);

		const res = await authedRequest(
			`/areas/${areaA.id}/versions/${versionB.id}/publish`,
			{
				cookie: admin.cookie,
				siteId,
				method: "POST",
				body: { effectiveDate: "2026-07-01" },
			},
		);
		expect(res.status).toBe(404);
	});

	it("reverts to draft on unpublish", async () => {
		const area = await createArea(siteId);
		const version = await createLayoutSpecVersion(area.id, {
			status: "published",
			effectiveDate: "2026-07-01",
			publishedAt: new Date(),
		});

		const res = await authedRequest(
			`/areas/${area.id}/versions/${version.id}/unpublish`,
			{ cookie: admin.cookie, siteId, method: "POST" },
		);
		expect(res.status).toBe(200);

		const detail = await get(`/areas/${area.id}`);
		const json = await detail.json();
		expect(json.versions[0].status).toBe("draft");
	});
});
