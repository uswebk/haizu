import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/db/client";
import { assignments, spotAssignments } from "../../src/db/schema";
import { authedRequest, signUpOrg, type TestUser } from "../helpers/auth";
import { resetDb } from "../helpers/db";
import {
	createArea,
	createEmployee,
	createLayoutSpecVersion,
	createShift,
	createSite,
	createSpot,
	createWorkPattern,
} from "../helpers/factory";

const DATE = "2026-07-17";

// PUT /assignments の検証: validateAssignmentTarget の前提チェックと
// saveAssignment のトランザクション upsert + spot_assignments 全置換。
describe("saving assignments (PUT /assignments)", () => {
	let admin: TestUser;
	let siteId: string;
	let areaId: string;
	let versionId: string;
	let shiftId: string;
	let spotId: string;
	let employeeId: string;

	beforeEach(async () => {
		await resetDb();
		admin = await signUpOrg();
		const site = await createSite(admin.organizationId);
		siteId = site.id;
		const workPattern = await createWorkPattern(siteId);
		shiftId = (await createShift(workPattern.id)).id;
		const area = await createArea(siteId);
		areaId = area.id;
		const version = await createLayoutSpecVersion(areaId, {
			status: "published",
			effectiveDate: "2026-01-01",
			publishedAt: new Date(),
		});
		versionId = version.id;
		spotId = (await createSpot(versionId)).id;
		employeeId = (await createEmployee(siteId)).id;
	});

	function put(body: Record<string, unknown>) {
		return authedRequest("/assignments", {
			cookie: admin.cookie,
			siteId,
			method: "PUT",
			body: {
				areaId,
				layoutSpecVersionId: versionId,
				date: DATE,
				shiftId,
				status: "draft",
				spotAssignments: [{ spotId, employeeId }],
				...body,
			},
		});
	}

	it("creates assignments and spot_assignments on save", async () => {
		const res = await put({});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.spotAssignments).toEqual([{ spotId, employeeId }]);

		const rows = await db.select().from(assignments);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.date).toBe(DATE);
		const spotRows = await db.select().from(spotAssignments);
		expect(spotRows).toHaveLength(1);
	});

	it("upserts on re-save for the same (area, date, shift) and replaces every spot_assignment", async () => {
		await put({});
		const employee2 = await createEmployee(siteId);
		const spot2 = await createSpot(versionId);

		const res = await put({
			status: "confirmed",
			spotAssignments: [{ spotId: spot2.id, employeeId: employee2.id }],
		});
		expect(res.status).toBe(200);

		const rows = await db.select().from(assignments);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.status).toBe("confirmed");

		const spotRows = await db.select().from(spotAssignments);
		expect(spotRows).toHaveLength(1);
		expect(spotRows[0]?.spotId).toBe(spot2.id);
		expect(spotRows[0]?.employeeId).toBe(employee2.id);
	});

	it("deletes every existing placement when saving empty spotAssignments", async () => {
		await put({});
		const res = await put({ spotAssignments: [] });
		expect(res.status).toBe(200);

		expect(await db.select().from(spotAssignments)).toHaveLength(0);
		// assignment 自体は残る(空の配置として保存)
		expect(await db.select().from(assignments)).toHaveLength(1);
	});

	it("keeps a save with a null shiftId (all-day) as a separate assignment", async () => {
		await put({});
		const res = await put({ shiftId: null });
		expect(res.status).toBe(200);

		const rows = await db.select().from(assignments);
		expect(rows).toHaveLength(2);
		expect(rows.map((r) => r.shiftId).sort()).toEqual([shiftId, null].sort());
	});

	it("returns 400 for a site with no work pattern registered", async () => {
		const site2 = await createSite(admin.organizationId);
		const area2 = await createArea(site2.id);
		const version2 = await createLayoutSpecVersion(area2.id, {
			status: "published",
			effectiveDate: "2026-01-01",
		});

		const res = await authedRequest("/assignments", {
			cookie: admin.cookie,
			siteId: site2.id,
			method: "PUT",
			body: {
				areaId: area2.id,
				layoutSpecVersionId: version2.id,
				date: DATE,
				shiftId: null,
				status: "draft",
				spotAssignments: [],
			},
		});
		expect(res.status).toBe(400);
	});

	it("returns 404 for an area belonging to another site", async () => {
		const site2 = await createSite(admin.organizationId);
		await createWorkPattern(site2.id);

		const res = await authedRequest("/assignments", {
			cookie: admin.cookie,
			siteId: site2.id,
			method: "PUT",
			body: {
				areaId,
				layoutSpecVersionId: versionId,
				date: DATE,
				shiftId: null,
				status: "draft",
				spotAssignments: [],
			},
		});
		expect(res.status).toBe(404);
	});

	it("returns 400 when assigning to a draft version", async () => {
		const draft = await createLayoutSpecVersion(areaId, {
			version: 2,
			status: "draft",
		});
		const res = await put({ layoutSpecVersionId: draft.id });
		expect(res.status).toBe(400);
	});

	it("returns 400 when assigning on a date before the version's effectiveDate", async () => {
		const future = await createLayoutSpecVersion(areaId, {
			version: 2,
			status: "published",
			effectiveDate: "2026-08-01",
			publishedAt: new Date(),
		});
		const res = await put({ layoutSpecVersionId: future.id });
		expect(res.status).toBe(400);

		// effectiveDate 以降の日付なら保存できる
		const ok = await put({ layoutSpecVersionId: future.id, date: "2026-08-01" });
		expect(ok.status).toBe(200);
	});

	it("reads back a saved assignment by date and shift via GET /assignments", async () => {
		await put({});
		const res = await authedRequest(
			`/assignments?date=${DATE}&shiftId=${shiftId}`,
			{ cookie: admin.cookie, siteId },
		);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.assignments).toHaveLength(1);
		expect(json.assignments[0].spotAssignments).toEqual([
			{ spotId, employeeId },
		]);
	});
});
