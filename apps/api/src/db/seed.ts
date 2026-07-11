import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { auth } from "../lib/auth";
import { signupContext } from "../lib/signup-context";
import {
	areas,
	employees,
	employeeTags,
	layoutSpecVersions,
	organizations,
	shifts,
	sites,
	spots,
	tags,
	user,
	workPatterns,
} from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

const SITES = [
	{
		name: "A工場",
		description: "製造ライン",
		iconBg: "#dcf2f0",
		iconColor: "#0ea5a4",
	},
	{
		name: "B倉庫",
		description: "物流センター",
		iconBg: "#e3eefe",
		iconColor: "#2f6df0",
	},
	{
		name: "C工事現場",
		description: "建設現場",
		iconBg: "#fbecd8",
		iconColor: "#e07b1a",
	},
];

const MOCK_DATA = [
	{
		name: "ライン1",
		versions: [
			{
				version: 1,
				status: "draft" as const,
				planImageName: "1F フロア図.png",
			},
			{
				version: 2,
				status: "published" as const,
				planImageName: "1F フロア図.png",
			},
		],
		activeVersionIndex: 1,
		spots: [
			{ label: "1", x: 18, y: 28, size: 56, order: 0 },
			{ label: "2", x: 38, y: 28, size: 56, order: 1 },
			{ label: "3", x: 60, y: 28, size: 56, order: 2 },
			{ label: "4", x: 22, y: 68, size: 56, order: 3 },
			{ label: "5", x: 50, y: 68, size: 56, order: 4 },
			{ label: "6", x: 76, y: 68, size: 56, order: 5 },
		],
	},
	{
		name: "ライン2",
		versions: [
			{
				version: 1,
				status: "published" as const,
				planImageName: "1F フロア図.png",
			},
		],
		activeVersionIndex: 0,
		spots: [
			{ label: "1", x: 20, y: 30, size: 56, order: 0 },
			{ label: "2", x: 55, y: 30, size: 56, order: 1 },
			{ label: "3", x: 25, y: 70, size: 56, order: 2 },
			{ label: "4", x: 70, y: 70, size: 56, order: 3 },
		],
	},
	{
		name: "検収室",
		versions: [{ version: 1, status: "draft" as const, planImageName: null }],
		activeVersionIndex: 0,
		spots: [],
	},
	{
		name: "仕分室",
		versions: [{ version: 1, status: "draft" as const, planImageName: null }],
		activeVersionIndex: 0,
		spots: [],
	},
];

const TAG_NAMES = [
	"製造ライン",
	"リーダー",
	"検査",
	"梱包",
	"物流",
	"フォークリフト",
];

const SHIFTS = [
	{ name: "日勤", startTime: "08:00", endTime: "17:00" },
	{ name: "遅番", startTime: "13:00", endTime: "22:00" },
	{ name: "夜勤", startTime: "22:00", endTime: "07:00" },
];

const AVATAR_COLORS = [
	"#2f8fd6",
	"#3d9970",
	"#f0883e",
	"#8b5cf6",
	"#26a69a",
	"#e85d75",
	"#d4a017",
	"#ef6c5a",
];

const EMPLOYEES = [
	{ lastName: "田中", firstName: "太郎" },
	{ lastName: "高橋", firstName: "実" },
	{ lastName: "中村", firstName: "健" },
	{ lastName: "佐藤", firstName: "花子" },
	{ lastName: "林", firstName: "美咲" },
	{ lastName: "渡辺", firstName: "涼" },
	{ lastName: "斎藤", firstName: "樹" },
	{ lastName: "鈴木", firstName: "翔太" },
];

async function seed() {
	console.log("Seeding...");

	const insertedOrgs = await db
		.insert(organizations)
		.values({ name: "株式会社haiz", email: "admin@haizu.co.jp" })
		.returning();
	const organization = insertedOrgs[0];
	if (!organization) throw new Error("Failed to create organization");

	const insertedSites = await db
		.insert(sites)
		.values(SITES.map((s) => ({ ...s, organizationId: organization.id })))
		.returning();
	const siteA = insertedSites[0];
	if (!siteA) throw new Error("Failed to create sites");
	console.log(`  Created org + ${insertedSites.length} sites`);

	// Demo admin for login testing (created via Better Auth with a hashed password).
	// organizationId / role are set by databaseHooks via signupContext.
	await signupContext.run(
		{ organizationId: organization.id, role: "admin" },
		() =>
			auth.api.signUpEmail({
				body: {
					name: "管理 太郎",
					email: "admin@haizu.co.jp",
					password: "password123",
				},
			}),
	);
	// Mark the demo user as verified so it can skip OTP confirmation
	await db
		.update(user)
		.set({ emailVerified: true })
		.where(eq(user.email, "admin@haizu.co.jp"));
	console.log("  Created demo user admin@haizu.co.jp / password123");

	// Link all existing employees, tags, areas, and work patterns to the first site (Plant A)
	const siteId = siteA.id;

	const insertedTags = await db
		.insert(tags)
		.values(TAG_NAMES.map((name) => ({ name, siteId })))
		.returning();
	console.log(`  Created ${insertedTags.length} tags`);

	const insertedPatterns = await db
		.insert(workPatterns)
		.values({ mode: "multi", siteId })
		.returning();
	const workPattern = insertedPatterns[0];
	if (workPattern) {
		await db.insert(shifts).values(
			SHIFTS.map((s, i) => ({
				workPatternId: workPattern.id,
				name: s.name,
				startTime: s.startTime,
				endTime: s.endTime,
				order: i,
			})),
		);
		console.log(`  Created work pattern with ${SHIFTS.length} shifts`);
	}

	const insertedEmployees = await db
		.insert(employees)
		.values(
			EMPLOYEES.map((e, i) => ({
				siteId,
				code: `EMP-${String(i + 1).padStart(3, "0")}`,
				lastName: e.lastName,
				firstName: e.firstName,
				avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length] ?? "#2f8fd6",
				isActive: true,
			})),
		)
		.returning();
	console.log(`  Created ${insertedEmployees.length} employees`);

	// Attach a primary tag to each employee (plus "Leader" every third person)
	const leaderTag = insertedTags.find((t) => t.name === "リーダー");
	const empTagLinks: { employeeId: string; tagId: string }[] = [];
	for (const [i, emp] of insertedEmployees.entries()) {
		const primary = insertedTags[i % insertedTags.length];
		if (primary) empTagLinks.push({ employeeId: emp.id, tagId: primary.id });
		if (i % 3 === 0 && leaderTag && leaderTag.id !== primary?.id) {
			empTagLinks.push({ employeeId: emp.id, tagId: leaderTag.id });
		}
	}
	if (empTagLinks.length > 0) {
		await db.insert(employeeTags).values(empTagLinks);
		console.log(`  Linked ${empTagLinks.length} employee tags`);
	}

	for (const data of MOCK_DATA) {
		const insertedAreas = await db
			.insert(areas)
			.values({ name: data.name, siteId })
			.returning();
		const area = insertedAreas[0];
		if (!area) continue;

		for (let i = 0; i < data.versions.length; i++) {
			const v = data.versions[i];
			if (!v) continue;
			const insertedVersions = await db
				.insert(layoutSpecVersions)
				.values({
					areaId: area.id,
					version: v.version,
					status: v.status,
					planImageName: v.planImageName,
					publishedAt: v.status === "published" ? new Date() : null,
				})
				.returning();
			const ver = insertedVersions[0];
			if (!ver) continue;

			if (i === data.activeVersionIndex && data.spots.length > 0) {
				await db
					.insert(spots)
					.values(
						data.spots.map((s) => ({ ...s, layoutSpecVersionId: ver.id })),
					);
			}
		}

		console.log(`  Created area: ${data.name}`);
	}

	console.log("Done.");
	await client.end();
	// The auth db client (a separate connection) keeps the process from exiting if left open, so close it explicitly
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
