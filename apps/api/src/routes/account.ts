import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { user } from "../db/schema";
import { emailSender } from "../email";
import { consumeEmailOtp, storeEmailOtp } from "../lib/email-otp";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

const emailRequestSchema = z.object({ newEmail: z.string().email() });
const emailVerifySchema = z.object({ otp: z.string().min(1) });

// ログインユーザー本人のアカウント設定（メールアドレス変更など）
export const accountRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.post("/email/otp", zValidator("json", emailRequestSchema), async (c) => {
		const userId = c.get("user").id;
		const { newEmail } = c.req.valid("json");

		const me = (
			await db.select().from(user).where(eq(user.id, userId)).limit(1)
		)[0];
		if (!me) return c.json({ error: "Not found" }, 404);
		if (me.email === newEmail) {
			return c.json({ error: "現在と同じメールアドレスです" }, 400);
		}
		const taken = (
			await db.select().from(user).where(eq(user.email, newEmail)).limit(1)
		)[0];
		if (taken) {
			return c.json({ error: "このメールアドレスは使用されています" }, 400);
		}

		const otp = await storeEmailOtp(`email-change:${userId}`, newEmail);
		await emailSender.send({
			to: newEmail,
			subject: "Email change verification code",
			body: `code: ${otp}`,
		});
		return c.json({ ok: true });
	})

	.post("/email/verify", zValidator("json", emailVerifySchema), async (c) => {
		const userId = c.get("user").id;
		const { otp } = c.req.valid("json");

		const result = await consumeEmailOtp(`email-change:${userId}`, otp);
		if (!result.ok) return c.json({ error: result.error }, 400);

		const taken = (
			await db
				.select()
				.from(user)
				.where(eq(user.email, result.newEmail))
				.limit(1)
		)[0];
		if (taken && taken.id !== userId) {
			return c.json({ error: "このメールアドレスは使用されています" }, 400);
		}

		await db
			.update(user)
			.set({
				email: result.newEmail,
				emailVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId));

		return c.json({ ok: true, email: result.newEmail });
	});
