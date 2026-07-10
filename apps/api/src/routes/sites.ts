import { effectiveSiteRole, SiteInputSchema, type SiteRole } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq, inArray, ne } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { employees, memberSites, sites } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireOrgWritePermission } from "../middleware/require-permission";
import type { AppEnv } from "../types";

const MAX_SITES = 10;

// 拠点アイコンの配色パレット（プロトタイプ準拠）。追加時に採番する。
const ICON_PALETTE = [
	{ bg: "#dcf2f0", color: "#0ea5a4" },
	{ bg: "#e3eefe", color: "#2f6df0" },
	{ bg: "#fbecd8", color: "#e07b1a" },
	{ bg: "#eae3fb", color: "#7c4dda" },
	{ bg: "#fde4ec", color: "#e0447b" },
];

export const sitesRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", requireOrgWritePermission("site:manage"))
	.get("/", async (c) => {
		const organizationId = c.get("organizationId");
		const actor = c.get("user");

		// ドメイン: 拠点は招待されているメンバーのみ閲覧可能（管理者は全拠点）
		let allowedSiteIds: string[] | null = null;
		// 拠点ごとの実効ロール。フロントの画面・ナビ制御がこれを使う。
		const roleBySite = new Map<string, SiteRole>();
		if (actor.role !== "admin") {
			const links = await db
				.select({ siteId: memberSites.siteId, role: memberSites.role })
				.from(memberSites)
				.where(eq(memberSites.userId, actor.id));
			allowedSiteIds = links.map((l) => l.siteId);
			for (const l of links) roleBySite.set(l.siteId, l.role);
			if (allowedSiteIds.length === 0) {
				return c.json({ sites: [] });
			}
		}

		const rows = await db
			.select({
				id: sites.id,
				organizationId: sites.organizationId,
				name: sites.name,
				description: sites.description,
				iconBg: sites.iconBg,
				iconColor: sites.iconColor,
				isActive: sites.isActive,
				createdAt: sites.createdAt,
				updatedAt: sites.updatedAt,
				employeeCount: count(employees.id),
			})
			.from(sites)
			.leftJoin(employees, eq(employees.siteId, sites.id))
			.where(
				allowedSiteIds
					? and(
							eq(sites.organizationId, organizationId),
							inArray(sites.id, allowedSiteIds),
						)
					: eq(sites.organizationId, organizationId),
			)
			.groupBy(sites.id)
			.orderBy(sites.createdAt, sites.name);

		const withRole = rows.map((row) => ({
			...row,
			// 管理者は全拠点で拠点管理者相当。member は member_sites の割り当てに従う。
			role: effectiveSiteRole(actor.role, roleBySite.get(row.id) ?? null),
		}));
		return c.json({ sites: withRole });
	})

	.post("/", zValidator("json", SiteInputSchema), async (c) => {
		const { name, description, isActive } = c.req.valid("json");
		const organizationId = c.get("organizationId");

		const existing = await db
			.select({ value: count() })
			.from(sites)
			.where(eq(sites.organizationId, organizationId));
		const total = existing[0]?.value ?? 0;
		if (total >= MAX_SITES) {
			return c.json({ error: `拠点は最大${MAX_SITES}件までです` }, 400);
		}

		const icon = ICON_PALETTE[total % ICON_PALETTE.length] ?? {
			bg: "#dcf2f0",
			color: "#0ea5a4",
		};
		const site = await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(sites)
				.values({
					organizationId,
					name,
					description,
					iconBg: icon.bg,
					iconColor: icon.color,
					isActive,
				})
				.returning();
			const row = inserted[0];
			if (!row) throw new Error("Insert failed");
			return row;
		});

		return c.json(site, 201);
	})

	.put("/:id", zValidator("json", SiteInputSchema), async (c) => {
		const { id } = c.req.param();
		const { name, description, isActive } = c.req.valid("json");
		const organizationId = c.get("organizationId");

		const target = await db.query.sites.findFirst({
			where: and(eq(sites.id, id), eq(sites.organizationId, organizationId)),
		});
		if (!target) return c.json({ error: "Not found" }, 404);

		// ドメイン: 拠点は削除不可・非アクティブ化のみ。最後のアクティブ拠点は無効化できない。
		if (target.isActive && !isActive) {
			const others = await db
				.select({ value: count() })
				.from(sites)
				.where(
					and(
						eq(sites.organizationId, target.organizationId),
						eq(sites.isActive, true),
						ne(sites.id, id),
					),
				);
			if ((others[0]?.value ?? 0) === 0) {
				return c.json(
					{ error: "最後のアクティブ拠点は非アクティブ化できません" },
					400,
				);
			}
		}

		const updated = await db
			.update(sites)
			.set({ name, description, isActive, updatedAt: new Date() })
			.where(eq(sites.id, id))
			.returning();

		return c.json(updated[0]);
	});
