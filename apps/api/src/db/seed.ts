import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { areas, layoutSpecVersions, spots } from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

const MOCK_DATA = [
	{
		name: "ライン1",
		versions: [
			{ version: 1, status: "draft" as const, planImageName: "1F フロア図.png" },
			{ version: 2, status: "published" as const, planImageName: "1F フロア図.png" },
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
			{ version: 1, status: "published" as const, planImageName: "1F フロア図.png" },
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

async function seed() {
	console.log("Seeding...");

	for (const data of MOCK_DATA) {
		const insertedAreas = await db
			.insert(areas)
			.values({ name: data.name })
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
				await db.insert(spots).values(
					data.spots.map((s) => ({ ...s, layoutSpecVersionId: ver.id })),
				);
			}
		}

		console.log(`  Created area: ${data.name}`);
	}

	console.log("Done.");
	await client.end();
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
