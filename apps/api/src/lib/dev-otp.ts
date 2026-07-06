// 開発用: 送信した OTP をメールアドレスごとに一時保持し、OTP画面で表示できるようにする。
// 本番でメール送信を実装する際はこのストアと dev-otp エンドポイントを削除する。
const store = new Map<string, string>();

export const devOtpStore = {
	set(email: string, otp: string) {
		store.set(email, otp);
	},
	get(email: string): string | undefined {
		return store.get(email);
	},
};
