import { beforeEach, describe, expect, it } from "vitest";
import {
	authedRequest,
	createMemberUser,
	signUpOrg,
	type TestUser,
} from "../helpers/auth";
import { resetDb } from "../helpers/db";
import { createMemberSite, createSite } from "../helpers/factory";

// siteScope ミドルウェア + サイト権限によるテナント分離の検証。
// 対象エンドポイントは代表として /employees(GET は全サイトロール可、書き込みは site_admin のみ)を使う。
describe("tenant isolation (siteScope / site permissions)", () => {
	let orgA: TestUser;
	let siteA: { id: string };

	beforeEach(async () => {
		await resetDb();
		orgA = await signUpOrg("組織A");
		siteA = await createSite(orgA.organizationId);
	});

	it("returns 401 for an unauthenticated request", async () => {
		const res = await authedRequest("/employees", { siteId: siteA.id });
		expect(res.status).toBe(401);
	});

	it("returns 400 when the x-site-id header is missing", async () => {
		const res = await authedRequest("/employees", { cookie: orgA.cookie });
		expect(res.status).toBe(400);
	});

	it("returns 404 for a site id that does not exist", async () => {
		const res = await authedRequest("/employees", {
			cookie: orgA.cookie,
			siteId: "00000000-0000-0000-0000-000000000000",
		});
		expect(res.status).toBe(404);
	});

	it("returns 404 for an inactive site", async () => {
		const inactive = await createSite(orgA.organizationId, { isActive: false });
		const res = await authedRequest("/employees", {
			cookie: orgA.cookie,
			siteId: inactive.id,
		});
		expect(res.status).toBe(404);
	});

	it("returns 403 for a site belonging to another organization", async () => {
		const orgB = await signUpOrg("組織B");
		const siteB = await createSite(orgB.organizationId);

		const res = await authedRequest("/employees", {
			cookie: orgA.cookie,
			siteId: siteB.id,
		});
		expect(res.status).toBe(403);
	});

	it("lets an org admin reach a site without a member_sites row", async () => {
		const res = await authedRequest("/employees", {
			cookie: orgA.cookie,
			siteId: siteA.id,
		});
		expect(res.status).toBe(200);
	});

	it("returns 403 for an org member who was not invited to the site", async () => {
		const member = await createMemberUser(orgA.organizationId, "member");
		const res = await authedRequest("/employees", {
			cookie: member.cookie,
			siteId: siteA.id,
		});
		expect(res.status).toBe(403);
	});

	it("lets an invited org member read their own site", async () => {
		const member = await createMemberUser(orgA.organizationId, "member");
		await createMemberSite(member.userId, siteA.id, "general");

		const res = await authedRequest("/employees", {
			cookie: member.cookie,
			siteId: siteA.id,
		});
		expect(res.status).toBe(200);
	});

	it("lets the general role read but returns 403 on write", async () => {
		const member = await createMemberUser(orgA.organizationId, "member");
		await createMemberSite(member.userId, siteA.id, "general");

		const read = await authedRequest("/employees", {
			cookie: member.cookie,
			siteId: siteA.id,
		});
		expect(read.status).toBe(200);

		const write = await authedRequest("/employees", {
			cookie: member.cookie,
			siteId: siteA.id,
			method: "POST",
			body: {
				code: "E001",
				lastName: "山田",
				firstName: "太郎",
				avatarColor: "#4488cc",
				tagIds: [],
				isActive: true,
			},
		});
		expect(write.status).toBe(403);
	});

	it("lets the site_admin role write", async () => {
		const member = await createMemberUser(orgA.organizationId, "member");
		await createMemberSite(member.userId, siteA.id, "site_admin");

		const write = await authedRequest("/employees", {
			cookie: member.cookie,
			siteId: siteA.id,
			method: "POST",
			body: {
				code: "E001",
				lastName: "山田",
				firstName: "太郎",
				avatarColor: "#4488cc",
				tagIds: [],
				isActive: true,
			},
		});
		expect(write.status).toBe(201);
	});
});
