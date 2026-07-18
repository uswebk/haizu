import type { SiteRole } from "@haizu/shared";
import { db } from "../../src/db/client";
import {
	areas,
	employees,
	layoutSpecVersions,
	memberSites,
	shifts,
	spots,
	workPatterns,
} from "../../src/db/schema";
import { sites } from "../../src/db/schema";

// テストデータのセットアップは DB 直 insert(検証対象の API だけ HTTP で叩く方針)。
// 必須カラムだけデフォルトを埋め、テスト側で必要な値だけ上書きする。

let seq = 0;
function next() {
	seq += 1;
	return seq;
}

export async function createSite(
	organizationId: string,
	overrides: Partial<typeof sites.$inferInsert> = {},
) {
	const inserted = await db
		.insert(sites)
		.values({
			organizationId,
			name: `拠点${next()}`,
			iconBg: "#eeeeee",
			iconColor: "#333333",
			...overrides,
		})
		.returning();
	return inserted[0]!;
}

export async function createMemberSite(
	userId: string,
	siteId: string,
	role: SiteRole = "general",
) {
	await db.insert(memberSites).values({ userId, siteId, role });
}

export async function createArea(siteId: string, name = `エリア${next()}`) {
	const inserted = await db.insert(areas).values({ siteId, name }).returning();
	return inserted[0]!;
}

export async function createLayoutSpecVersion(
	areaId: string,
	overrides: Partial<typeof layoutSpecVersions.$inferInsert> = {},
) {
	const inserted = await db
		.insert(layoutSpecVersions)
		.values({ areaId, version: 1, status: "draft", ...overrides })
		.returning();
	return inserted[0]!;
}

export async function createSpot(
	layoutSpecVersionId: string,
	overrides: Partial<typeof spots.$inferInsert> = {},
) {
	const inserted = await db
		.insert(spots)
		.values({
			layoutSpecVersionId,
			label: `スポット${next()}`,
			x: 0.5,
			y: 0.5,
			...overrides,
		})
		.returning();
	return inserted[0]!;
}

export async function createWorkPattern(
	siteId: string,
	mode: "single" | "multi" = "multi",
) {
	const inserted = await db
		.insert(workPatterns)
		.values({ siteId, mode })
		.returning();
	return inserted[0]!;
}

export async function createShift(
	workPatternId: string,
	overrides: Partial<typeof shifts.$inferInsert> = {},
) {
	const n = next();
	// (workPatternId, startTime, endTime) は一意制約があるため、デフォルトでも重複しない時刻にする
	const hour = String(n % 24).padStart(2, "0");
	const inserted = await db
		.insert(shifts)
		.values({
			workPatternId,
			name: `シフト${n}`,
			startTime: `${hour}:00`,
			endTime: `${hour}:45`,
			order: n,
			...overrides,
		})
		.returning();
	return inserted[0]!;
}

export async function createEmployee(
	siteId: string,
	overrides: Partial<typeof employees.$inferInsert> = {},
) {
	const n = next();
	const inserted = await db
		.insert(employees)
		.values({
			siteId,
			code: `EMP${String(n).padStart(4, "0")}`,
			lastName: "山田",
			firstName: `太郎${n}`,
			avatarColor: "#4488cc",
			...overrides,
		})
		.returning();
	return inserted[0]!;
}
