import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import type { AppEnv } from "../types";

// Better Auth のセッションを検証し、ユーザー・組織をコンテキストへ設定する。
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "認証が必要です" }, 401);
	}

	const user = session.user as {
		id: string;
		organizationId: string;
		role: string;
		isActive: boolean;
		emailVerified: boolean;
	};
	// 無効化されたユーザーはアクセス不可
	if (!user.isActive) {
		return c.json({ error: "このアカウントは無効です" }, 403);
	}
	// メールアドレス未確認のユーザーはデータAPIにアクセス不可（OTP確認を強制）
	if (!user.emailVerified) {
		return c.json({ error: "メールアドレスの確認が必要です" }, 403);
	}

	c.set("user", { id: user.id, organizationId: user.organizationId, role: user.role });
	c.set("organizationId", user.organizationId);
	await next();
});
