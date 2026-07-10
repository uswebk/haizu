import { MIN_PASSWORD_LENGTH } from "@haizu/shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { devSendEmail } from "./dev-email";
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
			devSendEmail(u.email, "パスワードリセット", url);
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user: u, url }) => {
			devSendEmail(u.email, "メールアドレスの確認", url);
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
			// 開発用: OTPをストアに保持しつつコンソールにも出力する（実メール送信は未実装）
			async sendVerificationOTP({ email, otp, type }) {
				devSendEmail(email, `OTP (${type})`, `code: ${otp}`);
			},
		}),
	],
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [WEB_ORIGIN],
});
