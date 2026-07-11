// タイムゾーン解決。デプロイ既定は環境変数 VITE_DEFAULT_TIMEZONE（IANA名）で設定する。
// 未設定ならランタイムのTZにフォールバックする（サーバは process.env.TZ、
// クライアントはブラウザのTZ）。工場・倉庫の単一拠点運用では環境変数で固定するのが基本。

export function getTimeZone(): string {
	const configured = import.meta.env.VITE_DEFAULT_TIMEZONE as
		| string
		| undefined;
	if (isValidTimeZone(configured)) return configured;
	return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function isValidTimeZone(tz: string | null | undefined): tz is string {
	if (!tz) return false;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}
