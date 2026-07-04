import { zValidator } from "@hono/zod-validator";
import { eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { imageSize } from "image-size";
import { z } from "zod";
import { db } from "../db/client";
import { areas, assignments, layoutSpecVersions, spots } from "../db/schema";
import { storage } from "../storage";

const LOCKED_MESSAGE =
	"この規格は配置決めで使用されているため編集できません。新しいバージョンを作成して編集してください。";

function todayDateStr() {
	return new Date().toISOString().slice(0, 10);
}

async function hasAssignmentsForVersion(versionId: string) {
	const found = await db.query.assignments.findFirst({
		where: eq(assignments.layoutSpecVersionId, versionId),
	});
	return !!found;
}

async function versionIdsWithAssignments(versionIds: string[]) {
	if (versionIds.length === 0) return new Set<string>();
	const rows = await db
		.selectDistinct({ versionId: assignments.layoutSpecVersionId })
		.from(assignments)
		.where(inArray(assignments.layoutSpecVersionId, versionIds));
	return new Set(rows.map((r) => r.versionId));
}

type VersionForResolution = {
	id: string;
	version: number;
	status: "draft" | "published";
	effectiveDate: string;
};

// 指定日に配置決めで適用される規格 = 公開済みかつ適用開始日が指定日以前のもののうち、
// 適用開始日が最も新しいもの（同日ならバージョン番号が大きい方）
function resolveCurrentVersion<T extends VersionForResolution>(
	versions: T[],
	date: string,
): T | null {
	const candidates = versions.filter(
		(v) => v.status === "published" && v.effectiveDate <= date,
	);
	candidates.sort((a, b) => {
		if (a.effectiveDate !== b.effectiveDate) {
			return b.effectiveDate.localeCompare(a.effectiveDate);
		}
		return b.version - a.version;
	});
	return candidates[0] ?? null;
}

export const areasRoute = new Hono()
	.get(
		"/",
		zValidator("query", z.object({ date: z.string().date().optional() })),
		async (c) => {
			const { date } = c.req.valid("query");
			const targetDate = date ?? todayDateStr();

			// LATERAL JOIN でアクティブバージョン（指定日に適用される公開版を優先、次点で最新draft）を特定してスポット数を取得
			const rows = await db.execute<{
				id: string;
				name: string;
				floorPlanName: string | null;
				spotCount: number;
				currentVersion: string | null;
				currentStatus: "draft" | "published" | null;
			}>(
				// todo: 生SQLを使用しなくて良い方法を考える
				sql`
				SELECT
					a.id,
					a.name,
					av.plan_image_name AS "floorPlanName",
					COALESCE((
						SELECT COUNT(*)::int FROM spots
						WHERE layout_spec_version_id = av.id
					), 0) AS "spotCount",
					'v' || av.version AS "currentVersion",
					av.status AS "currentStatus"
				FROM areas a
				LEFT JOIN LATERAL (
					SELECT id, plan_image_name, version, status
					FROM layout_spec_versions
					WHERE area_id = a.id
					ORDER BY
						(status = 'published' AND effective_date <= ${targetDate}::date) DESC,
						effective_date DESC,
						version DESC
					LIMIT 1
				) av ON true
				ORDER BY a.created_at
			`,
			);

			return c.json({ areas: rows });
		},
	)

	.get("/:id", async (c) => {
		const { id } = c.req.param();

		const area = await db.query.areas.findFirst({
			where: eq(areas.id, id),
		});
		if (!area) return c.json({ error: "Not found" }, 404);

		const versions = await db
			.select()
			.from(layoutSpecVersions)
			.where(eq(layoutSpecVersions.areaId, id))
			.orderBy(layoutSpecVersions.version);

		// 現在の規格（本日時点） = 公開済みかつ適用開始日が本日以前のうち最新のもの
		const currentVersion = resolveCurrentVersion(versions, todayDateStr());
		// エディタのデフォルト表示 = 現在の規格 or 最新の下書き
		const activeVersion = currentVersion ?? versions[versions.length - 1];
		const lockedVersionIds = await versionIdsWithAssignments(
			versions.map((v) => v.id),
		);

		return c.json({
			id: area.id,
			name: area.name,
			hasFloorPlan: versions.some((v) => v.planImageName),
			floorPlanName: activeVersion?.planImageName ?? null,
			planImageUrl: activeVersion?.planImageUrl ?? null,
			planAspectRatio: activeVersion?.planAspectRatio ?? undefined,
			planImageScale: activeVersion?.planImageScale ?? 1,
			planImageOffsetX: activeVersion?.planImageOffsetX ?? 0,
			planImageOffsetY: activeVersion?.planImageOffsetY ?? 0,
			versions: versions.map((v) => ({
				id: v.id,
				label: `v${v.version}`,
				status: v.status,
				effectiveDate: v.effectiveDate,
				isActive: v.id === activeVersion?.id,
				isCurrent: v.id === currentVersion?.id,
				// 配置決めで使用済み（スポット編集・図面変更・公開取消不可）
				hasAssignments: lockedVersionIds.has(v.id),
			})),
		});
	})

	.get("/:id/versions/:versionId/spots", async (c) => {
		const { versionId } = c.req.param();

		const versionSpots = await db
			.select()
			.from(spots)
			.where(eq(spots.layoutSpecVersionId, versionId))
			.orderBy(spots.order);

		return c.json({
			spots: versionSpots.map((s) => ({
				id: s.id,
				label: s.label,
				x: s.x,
				y: s.y,
				size: s.size,
			})),
		});
	})

	.post(
		"/",
		zValidator("json", z.object({ name: z.string().min(1) })),
		async (c) => {
			const { name } = c.req.valid("json");

			const inserted = await db.insert(areas).values({ name }).returning();
			const area = inserted[0];
			if (!area) return c.json({ error: "Insert failed" }, 500);
			await db.insert(layoutSpecVersions).values({
				areaId: area.id,
				version: 1,
				status: "draft",
			});

			return c.json({ id: area.id, name: area.name }, 201);
		},
	)

	.put(
		"/:id/versions/:versionId",
		zValidator(
			"json",
			z.object({
				spots: z.array(
					z.object({
						id: z.string().optional(),
						label: z.string(),
						x: z.number(),
						y: z.number(),
						size: z.number().int(),
					}),
				),
				imageScale: z.number().positive().optional(),
			}),
		),
		async (c) => {
			const { versionId } = c.req.param();
			const { spots: newSpots, imageScale } = c.req.valid("json");

			if (await hasAssignmentsForVersion(versionId)) {
				return c.json({ error: LOCKED_MESSAGE }, 409);
			}

			// todo: トランザクションを張ってatmicを担保する
			await db.delete(spots).where(eq(spots.layoutSpecVersionId, versionId));

			if (newSpots.length > 0) {
				await db.insert(spots).values(
					newSpots.map((s, i) => ({
						layoutSpecVersionId: versionId,
						label: s.label,
						x: s.x,
						y: s.y,
						size: s.size,
						order: i,
					})),
				);
			}

			await db
				.update(layoutSpecVersions)
				.set({
					...(imageScale !== undefined ? { planImageScale: imageScale } : {}),
					updatedAt: new Date(),
				})
				.where(eq(layoutSpecVersions.id, versionId));

			return c.json({ ok: true });
		},
	)

	.post(
		"/:id/versions/:versionId/floor-plan",
		bodyLimit({ maxSize: 15 * 1024 * 1024 }),
		async (c) => {
			const { versionId } = c.req.param();

			if (await hasAssignmentsForVersion(versionId)) {
				return c.json({ error: LOCKED_MESSAGE }, 409);
			}

			const body = await c.req.parseBody();
			const file = body.file;
			if (!(file instanceof File)) {
				return c.json({ error: "file is required" }, 400);
			}

			const buffer = Buffer.from(await file.arrayBuffer());
			const { url } = await storage.save(file.name, buffer);

			let aspectRatio: number | null;
			try {
				const { width, height } = imageSize(buffer);
				aspectRatio = width / height;
			} catch {
				aspectRatio = null;
			}

			await db
				.update(layoutSpecVersions)
				.set({
					planImageUrl: url,
					planImageName: file.name,
					planAspectRatio: aspectRatio,
					planImageScale: 1,
					planImageOffsetX: 0,
					planImageOffsetY: 0,
					updatedAt: new Date(),
				})
				.where(eq(layoutSpecVersions.id, versionId));

			return c.json({ url, name: file.name, aspectRatio });
		},
	)

	.delete("/:id/versions/:versionId/floor-plan", async (c) => {
		const { versionId } = c.req.param();

		if (await hasAssignmentsForVersion(versionId)) {
			return c.json({ error: LOCKED_MESSAGE }, 409);
		}

		const version = await db.query.layoutSpecVersions.findFirst({
			where: eq(layoutSpecVersions.id, versionId),
		});
		if (!version) return c.json({ error: "Not found" }, 404);

		if (version.planImageUrl) {
			await storage.remove(version.planImageUrl);
		}

		await db
			.update(layoutSpecVersions)
			.set({
				planImageUrl: null,
				planImageName: null,
				planAspectRatio: null,
				planImageScale: 1,
				planImageOffsetX: 0,
				planImageOffsetY: 0,
				updatedAt: new Date(),
			})
			.where(eq(layoutSpecVersions.id, versionId));

		return c.json({ ok: true });
	})

	.post(
		"/:id/versions/:versionId/publish",
		zValidator("json", z.object({ effectiveDate: z.string().date() })),
		async (c) => {
			const { id, versionId } = c.req.param();
			const { effectiveDate } = c.req.valid("json");

			// 指定バージョンを published にするが、他のバージョンはそのままにする
			// 公開後、すぐに戻したいケースなどがあり、他のバージョンを下書きに戻すと全バージョンが下書き状態となってしまうことを防ぐため
			await db
				.update(layoutSpecVersions)
				.set({ status: "published", publishedAt: new Date(), effectiveDate })
				.where(eq(layoutSpecVersions.id, versionId));

			return c.json({ ok: true });
		},
	)

	.post(
		"/:id/versions/:versionId/duplicate",
		zValidator(
			"json",
			z.object({
				spots: z
					.array(
						z.object({
							label: z.string(),
							x: z.number(),
							y: z.number(),
							size: z.number().int(),
						}),
					)
					.optional(),
				imageScale: z.number().positive().optional(),
			}),
		),
		async (c) => {
			const { id, versionId } = c.req.param();
			const { spots: overrideSpots, imageScale } = c.req.valid("json");

			// todo: select for updateを使用すべきか検討。
			// 同時に操作された場合、バージョンが重複してしまう可能性がある。
			const source = await db.query.layoutSpecVersions.findFirst({
				where: eq(layoutSpecVersions.id, versionId),
			});
			if (!source) return c.json({ error: "Not found" }, 404);

			const versions = await db
				.select({ version: layoutSpecVersions.version })
				.from(layoutSpecVersions)
				.where(eq(layoutSpecVersions.areaId, id))
				.orderBy(layoutSpecVersions.version);
			const nextVersion = (versions[versions.length - 1]?.version ?? 0) + 1;

			const inserted = await db
				.insert(layoutSpecVersions)
				.values({
					areaId: id,
					version: nextVersion,
					status: "draft",
					planImageUrl: source.planImageUrl,
					planImageName: source.planImageName,
					planAspectRatio: source.planAspectRatio,
					planImageScale: imageScale ?? source.planImageScale,
					planImageOffsetX: source.planImageOffsetX,
					planImageOffsetY: source.planImageOffsetY,
				})
				.returning();
			const newVersion = inserted[0];
			if (!newVersion) return c.json({ error: "Insert failed" }, 500);

			const newSpots =
				overrideSpots ??
				(
					await db
						.select()
						.from(spots)
						.where(eq(spots.layoutSpecVersionId, versionId))
						.orderBy(spots.order)
				).map((s) => ({ label: s.label, x: s.x, y: s.y, size: s.size }));

			if (newSpots.length > 0) {
				await db.insert(spots).values(
					newSpots.map((s, i) => ({
						layoutSpecVersionId: newVersion.id,
						label: s.label,
						x: s.x,
						y: s.y,
						size: s.size,
						order: i,
					})),
				);
			}

			return c.json({ id: newVersion.id, label: `v${newVersion.version}` }, 201);
		},
	)

	.post("/:id/versions/:versionId/unpublish", async (c) => {
		const { versionId } = c.req.param();

		if (await hasAssignmentsForVersion(versionId)) {
			return c.json(
				{ error: "配置決めに使用されたバージョンは取り消せません" },
				409,
			);
		}

		const updated = await db
			.update(layoutSpecVersions)
			.set({ status: "draft", publishedAt: null })
			.where(eq(layoutSpecVersions.id, versionId))
			.returning({ id: layoutSpecVersions.id });

		if (!updated[0]) return c.json({ error: "Not found" }, 404);

		return c.json({ ok: true });
	})

	.delete("/:id", async (c) => {
		const { id } = c.req.param();

		const versionIds = (
			await db
				.select({ id: layoutSpecVersions.id })
				.from(layoutSpecVersions)
				.where(eq(layoutSpecVersions.areaId, id))
		).map((v) => v.id);
		if ((await versionIdsWithAssignments(versionIds)).size > 0) {
			return c.json(
				{ error: "配置決めに使用された規格があるエリアは削除できません" },
				409,
			);
		}

		const deleted = await db
			.delete(areas)
			.where(eq(areas.id, id))
			.returning({ id: areas.id });

		if (!deleted[0]) return c.json({ error: "Not found" }, 404);

		return c.json({ ok: true });
	});
