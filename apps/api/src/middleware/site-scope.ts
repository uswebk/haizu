import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/client";
import { memberSites, sites } from "../db/schema";
import type { AppEnv } from "../types";

// requireAuth の後段で使う。x-site-id で選択された拠点が、セッションユーザーの組織に
// 属し、かつ（管理者以外は）その拠点に招待されたメンバーであることを検証する
// （他組織の拠点や、自分が招待されていない拠点へのなりすましアクセスを防ぐ）。
export const siteScope = createMiddleware<AppEnv>(async (c, next) => {
	const siteId = c.req.header("x-site-id");
	if (!siteId) {
		return c.json({ error: "x-site-id ヘッダーが必要です" }, 400);
	}

	const site = await db.query.sites.findFirst({
		where: eq(sites.id, siteId),
	});
	if (!site || !site.isActive) {
		return c.json({ error: "拠点が見つかりません" }, 404);
	}
	if (site.organizationId !== c.get("organizationId")) {
		return c.json({ error: "この拠点にアクセスする権限がありません" }, 403);
	}

	const actor = c.get("user");
	if (actor.role !== "admin") {
		const membership = await db.query.memberSites.findFirst({
			where: and(
				eq(memberSites.userId, actor.id),
				eq(memberSites.siteId, site.id),
			),
		});
		if (!membership) {
			return c.json({ error: "この拠点にアクセスする権限がありません" }, 403);
		}
	}

	c.set("siteId", site.id);
	await next();
});
