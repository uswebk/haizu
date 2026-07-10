import {
	canOrg,
	canSite,
	type OrgPermission,
	type OrgRole,
	type SitePermission,
	type SiteRole,
} from "@haizu/shared";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isWriteMethod(method: string): boolean {
	return WRITE_METHODS.has(method.toUpperCase());
}

export type PermissionResult =
	| { ok: true }
	| { ok: false; status: 403; message: string };

const DENIED: PermissionResult = {
	ok: false,
	status: 403,
	message: "この操作を行う権限がありません",
};

// 判定の純粋関数。Hono / DB に依存しないため単体テスト可能。
export function evaluateOrgPermission(
	orgRole: OrgRole,
	permission: OrgPermission,
): PermissionResult {
	return canOrg(orgRole, permission) ? { ok: true } : DENIED;
}

export function evaluateSitePermission(
	siteRole: SiteRole,
	permission: SitePermission,
): PermissionResult {
	return canSite(siteRole, permission) ? { ok: true } : DENIED;
}

// 組織スコープ。requireAuth の後段で使う。
export function requireOrgPermission(permission: OrgPermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const result = evaluateOrgPermission(c.get("user").role, permission);
		if (!result.ok) return c.json({ error: result.message }, result.status);
		await next();
	});
}

export function requireOrgWritePermission(permission: OrgPermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		if (isWriteMethod(c.req.method)) {
			const result = evaluateOrgPermission(c.get("user").role, permission);
			if (!result.ok) return c.json({ error: result.message }, result.status);
		}
		await next();
	});
}

// 拠点スコープ。siteScope の後段でのみ使える（siteRole が解決済みである必要がある）。
export function requireSitePermission(permission: SitePermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const result = evaluateSitePermission(c.get("siteRole"), permission);
		if (!result.ok) return c.json({ error: result.message }, result.status);
		await next();
	});
}

// 書き込みメソッドのみ制限し、GET は素通しする。
// ルートに新しい POST/PUT/DELETE を足しても自動で保護される（認可の付け忘れを防ぐ）。
export function requireSiteWritePermission(permission: SitePermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		if (isWriteMethod(c.req.method)) {
			const result = evaluateSitePermission(c.get("siteRole"), permission);
			if (!result.ok) return c.json({ error: result.message }, result.status);
		}
		await next();
	});
}
