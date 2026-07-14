import {
	MIN_PASSWORD_LENGTH,
	OTP_RESEND_COOLDOWN_SECONDS,
} from "@haizu/shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { emailSender } from "../email";
import { WEB_ORIGIN } from "./env";
import { signupContext } from "./signup-context";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user, session, account, verification },
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: MIN_PASSWORD_LENGTH,
		// For the MVP, allow login without OTP (email verification is a later phase)
		requireEmailVerification: false,
		sendResetPassword: async ({ user: u, url }) => {
			await emailSender.send({
				to: u.email,
				subject: "Password reset",
				body: url,
			});
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user: u, url }) => {
			await emailSender.send({
				to: u.email,
				subject: "Verify your email",
				body: url,
			});
		},
	},
	user: {
		// Set input:false on organizationId / role so the client can't inject them,
		// and set them only server-side via databaseHooks at sign-up (prevents tenant crossover).
		additionalFields: {
			organizationId: { type: "string", required: false, input: false },
			// Org role. Per-site permissions are held by member_sites.role.
			role: {
				type: "string",
				required: false,
				defaultValue: "member",
				input: false,
			},
			isActive: {
				type: "boolean",
				required: false,
				defaultValue: true,
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (userData) => {
					// Organization/role are passed only from the custom sign-up (inside signup-context).
					// Outside that context (e.g. the standard /api/auth/sign-up/email), organizationId is
					// not set and creation fails on the NOT NULL constraint = public sign-up is effectively disabled.
					const ctx = signupContext.getStore();
					if (!ctx) return;
					return {
						data: {
							...userData,
							organizationId: ctx.organizationId,
							role: ctx.role,
						},
					};
				},
			},
		},
	},
	// Better Auth only rate-limits in production by default. Enable it everywhere so the OTP
	// resend limit is exercised in dev too. Counters are in-memory, so with multiple API
	// instances the limit is per-instance; move to `storage: "database"` before scaling out.
	rateLimit: {
		enabled: true,
		customRules: {
			// Sending an OTP costs an email, so a client that ignores the UI countdown (reload,
			// direct API call) must still be blocked from spamming the address.
			"/email-otp/send-verification-otp": {
				window: OTP_RESEND_COOLDOWN_SECONDS,
				max: 1,
			},
		},
	},
	plugins: [
		emailOTP({
			// Matches the TTL of the in-house email-change OTP (lib/email-otp.ts).
			expiresIn: 600,
			allowedAttempts: 3,
			async sendVerificationOTP({ email, otp, type }) {
				await emailSender.send({
					to: email,
					subject: `OTP (${type})`,
					body: `code: ${otp}`,
				});
			},
		}),
	],
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [WEB_ORIGIN],
});
