import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { imageSize } from "image-size";
import { z } from "zod";
import { db } from "../db/client";
import { areas, layoutSpecVersions, spots } from "../db/schema";
import { storage } from "../storage";

export const areasRoute = new Hono()
	.get("/", async (c) => {
		// LATERAL JOIN でアクティブバージョン（published優先、次点で最新draft）を特定してスポット数を取得
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
				ORDER BY (status = 'published') DESC, version DESC
				LIMIT 1
			) av ON true
			ORDER BY a.created_at
		`,
		);

		return c.json({ areas: rows });
	})

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

		const publishedVersions = versions.filter((v) => v.status === "published");
		// 現在の規格 = published の中でバージョン番号が最大のもの
		const currentVersion =
			publishedVersions.length > 0
				? publishedVersions[publishedVersions.length - 1]
				: null;
		// エディタのデフォルト表示 = 現在の規格 or 最新の下書き
		const activeVersion = currentVersion ?? versions[versions.length - 1];

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
				isActive: v.id === activeVersion?.id,
				isCurrent: v.id === currentVersion?.id,
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

	.post("/:id/versions/:versionId/publish", async (c) => {
		const { id, versionId } = c.req.param();

		// 指定バージョンを published に（他のバージョンはそのままにする）
		await db
			.update(layoutSpecVersions)
			.set({ status: "published", publishedAt: new Date() })
			.where(eq(layoutSpecVersions.id, versionId));

		return c.json({ ok: true });
	})

	.post("/:id/versions/:versionId/unpublish", async (c) => {
		const { versionId } = c.req.param();

		// TODO: assignments テーブル実装後、該当バージョンへの参照があれば 409 を返す
		// const hasAssignments = await db.query.assignments.findFirst({ where: eq(assignments.layoutSpecVersionId, versionId) });
		// if (hasAssignments) return c.json({ error: "配置決めに使用されたバージョンは取り消せません" }, 409);

		const updated = await db
			.update(layoutSpecVersions)
			.set({ status: "draft", publishedAt: null })
			.where(eq(layoutSpecVersions.id, versionId))
			.returning({ id: layoutSpecVersions.id });

		if (!updated[0]) return c.json({ error: "Not found" }, 404);

		return c.json({ ok: true });
	});
