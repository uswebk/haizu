import { SignUpInputSchema } from "@haizu/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { organizations } from "../db/schema";
import { auth } from "../lib/auth";
import { signupContext } from "../lib/signup-context";

// Sign-up involves "company name -> create organization", so instead of using Better Auth's standard signUp
// directly, we wrap it here. Create the organization first, then create the user with that organizationId.
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
			// Use asResponse to get a Response (including Set-Cookie) and return it to the client as-is.
			// On things like a duplicate email, a non-OK Response is returned rather than thrown, so roll back the organization in that case too.
			// organizationId / role aren't passed in the body; databaseHooks set them via signupContext.
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
			// Send an OTP to verify the email address
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
