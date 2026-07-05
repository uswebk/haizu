import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/client";
import { organizations, sites } from "../db/schema";
import type { AppEnv } from "../types";

// 認証未導入のため、現在拠点はフロントが x-site-id ヘッダーで自己申告する。
// 将来 Better Auth を導入したら、セッションユーザーの拠点所属チェックへ差し替える。
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

	c.set("siteId", site.id);
	c.set("organizationId", site.organizationId);
	await next();
});

// 認証未導入のため「現在の組織」は先頭（唯一）の組織として解決する。
export async function resolveDefaultOrganizationId(): Promise<string> {
	const org = await db.query.organizations.findFirst({
		orderBy: organizations.createdAt,
	});
	if (!org) throw new Error("組織が存在しません");
	return org.id;
}
