import { MIN_PASSWORD_LENGTH } from "@haizu/shared";
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
		// MVP では OTP を使わずログイン可能にする（メール確認は次フェーズ）
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
		// organizationId / role はクライアントから注入できないよう input:false とし、
		// サインアップ時に databaseHooks 経由でサーバー側からのみ設定する（テナント越境防止）。
		additionalFields: {
			organizationId: { type: "string", required: false, input: false },
			// 組織ロール。拠点ごとの権限は member_sites.role が持つ。
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
					// カスタムサインアップ(signup-context 内)からのみ組織・権限が渡る。
					// コンテキスト外（標準 /api/auth/sign-up/email 等）では organizationId が
					// 付与されず NOT NULL 制約で作成が失敗する = 公開サインアップは実質無効。
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
	plugins: [
		emailOTP({
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
