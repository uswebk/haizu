import { SignUpInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { organizations } from "../db/schema";
import { auth } from "../lib/auth";
import { signupContext } from "../lib/signup-context";

// サインアップは「会社名 → 組織作成」を伴うため、Better Auth 標準の signUp をそのまま
// 使わずここでラップする。組織を作ってから、その organizationId 付きでユーザーを作成する。
export const authRoute = new Hono().post(
	"/sign-up",
	zValidator("json", SignUpInputSchema),
	async (c) => {
		const { name, companyName, email, password } = c.req.valid("json");

		const inserted = await db
			.insert(organizations)
			.values({ name: companyName, email })
			.returning();
		const organization = inserted[0];
		if (!organization) {
			return c.json({ error: "組織の作成に失敗しました" }, 500);
		}

		const rollbackOrg = () =>
			db.delete(organizations).where(eq(organizations.id, organization.id));

		try {
			// asResponse で Set-Cookie を含む Response を得て、そのままクライアントへ返す。
			// メール重複等では例外ではなく非OKの Response が返るため、その場合も組織を戻す。
			// organizationId / role はボディでは渡さず、signupContext 経由で databaseHooks が設定する。
			const res = await signupContext.run(
				{ organizationId: organization.id, role: "admin" },
				() =>
					auth.api.signUpEmail({
						body: { name, email, password },
						asResponse: true,
					}),
			);
			if (!res.ok) {
				await rollbackOrg();
				return res;
			}
			// メールアドレス確認のため OTP を送信する
			await auth.api.sendVerificationOTP({
				body: { email, type: "email-verification" },
			});
			return res;
		} catch (error) {
			await rollbackOrg();
			const message =
				error instanceof Error && error.message
					? error.message
					: "サインアップに失敗しました";
			return c.json({ error: message }, 400);
		}
	},
);
