// Pure function that decides whether a session user may access the data API.
// Called from the requireAuth middleware. It doesn't depend on Better Auth / the DB, so it's unit-testable.
type SessionUser = { isActive: boolean; emailVerified: boolean };

export type AccessResult =
	| { ok: true }
	| { ok: false; status: 403; message: string };

// Evaluate isActive before emailVerified (deactivated accounts are blocked regardless of verification state).
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
