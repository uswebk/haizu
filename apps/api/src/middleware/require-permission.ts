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

// Pure decision function. It doesn't depend on Hono / the DB, so it's unit-testable.
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

// Organization scope. Used after requireAuth.
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

// Site scope. Usable only after siteScope (siteRole must already be resolved).
export function requireSitePermission(permission: SitePermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		const result = evaluateSitePermission(c.get("siteRole"), permission);
		if (!result.ok) return c.json({ error: result.message }, result.status);
		await next();
	});
}

// Restrict only write methods; let GET pass through.
// New POST/PUT/DELETE routes are protected automatically (prevents forgetting to add authorization).
export function requireSiteWritePermission(permission: SitePermission) {
	return createMiddleware<AppEnv>(async (c, next) => {
		if (isWriteMethod(c.req.method)) {
			const result = evaluateSitePermission(c.get("siteRole"), permission);
			if (!result.ok) return c.json({ error: result.message }, result.status);
		}
		await next();
	});
}
