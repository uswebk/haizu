import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { WEB_ORIGIN } from "./env";
import { signupContext } from "./signup-context";

// メール送信は未実装のため、開発用スタブとしてコンソールに出力する。
// 将来 OTP・招待・パスワードリセットを実装する際に実送信へ差し替える。
function devSendEmail(to: string, subject: string, body: string) {
	console.log(`\n[dev-email] to=${to}\n  subject: ${subject}\n  ${body}\n`);
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user, session, account, verification },
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
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
			role: { type: "string", required: false, defaultValue: "admin", input: false },
			isActive: { type: "boolean", required: false, defaultValue: true, input: false },
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
