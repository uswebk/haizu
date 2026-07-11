import { OrganizationUpdateInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { organizations } from "../db/schema";
import { emailSender } from "../email";
import { consumeEmailOtp, storeEmailOtp } from "../lib/email-otp";
import { requireAuth } from "../middleware/auth";
import { requireOrgWritePermission } from "../middleware/require-permission";
import type { AppEnv } from "../types";

const emailRequestSchema = z.object({ newEmail: z.string().email() });
const emailVerifySchema = z.object({ otp: z.string().min(1) });

// 事業所情報の閲覧は全ロール、変更は「管理者」のみ。
export const organizationsRoute = new Hono<AppEnv>()
	.use("*", requireAuth)
	.use("*", requireOrgWritePermission("org:write"))
	.get("/", async (c) => {
		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, c.get("organizationId")),
		});
		if (!org) return c.json({ error: "Not found" }, 404);

		return c.json({
			id: org.id,
			name: org.name,
			email: org.email,
			isActive: org.isActive,
		});
	})

	.put("/", zValidator("json", OrganizationUpdateInputSchema), async (c) => {
		const { name } = c.req.valid("json");

		const updated = await db
			.update(organizations)
			.set({ name, updatedAt: new Date() })
			.where(eq(organizations.id, c.get("organizationId")))
			.returning();
		const org = updated[0];
		if (!org) return c.json({ error: "Not found" }, 404);

		return c.json({
			id: org.id,
			name: org.name,
			email: org.email,
			isActive: org.isActive,
		});
	})

	// 事業所の連絡先メール変更: 新アドレス宛のOTPで受信可否を確認する。
	.post(
		"/contact-email/otp",
		zValidator("json", emailRequestSchema),
		async (c) => {
			const organizationId = c.get("organizationId");
			const { newEmail } = c.req.valid("json");

			const otp = await storeEmailOtp(`org-email:${organizationId}`, newEmail);
			await emailSender.send({
				to: newEmail,
				subject: "Contact email verification code",
				body: `code: ${otp}`,
			});
			return c.json({ ok: true });
		},
	)

	.post(
		"/contact-email/verify",
		zValidator("json", emailVerifySchema),
		async (c) => {
			const organizationId = c.get("organizationId");
			const { otp } = c.req.valid("json");

			const result = await consumeEmailOtp(`org-email:${organizationId}`, otp);
			if (!result.ok) return c.json({ error: result.error }, 400);

			await db
				.update(organizations)
				.set({ email: result.newEmail, updatedAt: new Date() })
				.where(eq(organizations.id, organizationId));

			return c.json({ ok: true, email: result.newEmail });
		},
	);
