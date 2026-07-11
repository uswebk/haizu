import type { OrgRole } from "@haizu/shared";
import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import type { AppEnv } from "../types";
import { evaluateSessionAccess } from "./session-access";

// Validates the Better Auth session and sets the user/organization on the context.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "認証が必要です" }, 401);
	}

	const user = session.user as {
		id: string;
		organizationId: string;
		role: OrgRole;
		isActive: boolean;
		emailVerified: boolean;
	};
	const access = evaluateSessionAccess(user);
	if (!access.ok) {
		return c.json({ error: access.message }, access.status);
	}

	c.set("user", {
		id: user.id,
		organizationId: user.organizationId,
		role: user.role,
	});
	c.set("organizationId", user.organizationId);
	await next();
});
