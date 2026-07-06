import { zValidator } from "@hono/zod-validator";
import { SiteInputSchema } from "@haiz/shared";
import { and, count, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { employees, sites } from "../db/schema";
import { requireAuth } from "../middleware/auth";
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
	.get("/", async (c) => {
		const organizationId = c.get("organizationId");

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
			.where(eq(sites.organizationId, organizationId))
			.groupBy(sites.id)
			.orderBy(sites.createdAt, sites.name);

		return c.json({ sites: rows });
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
		const inserted = await db
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
		const site = inserted[0];
		if (!site) return c.json({ error: "Insert failed" }, 500);

		return c.json(site, 201);
	})

	.put("/:id", zValidator("json", SiteInputSchema), async (c) => {
		const { id } = c.req.param();
		const { name, description, isActive } = c.req.valid("json");

		const target = await db.query.sites.findFirst({ where: eq(sites.id, id) });
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
