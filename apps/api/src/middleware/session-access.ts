// セッションユーザーがデータAPIへアクセス可能かを判定する純粋関数。
// requireAuth ミドルウェアから呼び出す。Better Auth / DB に依存しないため単体テスト可能。
type SessionUser = { isActive: boolean; emailVerified: boolean };

export type AccessResult =
	| { ok: true }
	| { ok: false; status: 403; message: string };

// isActive を emailVerified より先に評価する（無効化アカウントは確認状態に関わらず遮断）。
export function evaluateSessionAccess(user: SessionUser): AccessResult {
	if (!user.isActive) {
		return { ok: false, status: 403, message: "このアカウントは無効です" };
	}
	if (!user.emailVerified) {
		return {
			ok: false,
			status: 403,
			message: "メールアドレスの確認が必要です",
		};
	}
	return { ok: true };
}
