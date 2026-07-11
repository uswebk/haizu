// 日付・時刻のフォーマット/変換ユーティリティ（アプリ内で散らばらないよう集約する）
// 「今日」や時計は閲覧者の端末タイムゾーンに合わせる（getTimeZone）。
// カレンダー日付(YYYY-MM-DD)はタイムゾーンを持たない値なので、表示時はUTC固定で
// 整形してTZによる日付ズレを避ける。

import i18n from "#/i18n/config";
import { getTimeZone } from "#/lib/timezone";

// 現在のロケール（"ja" / "en"）。表示系フォーマッタはこれに追従する。
function currentLocale(): string {
	return i18n.resolvedLanguage ?? i18n.language ?? "en";
}

// Date（瞬間）→ 端末TZにおける "YYYY-MM-DD"
export function toDateStr(d: Date): string {
	// en-CA は "YYYY-MM-DD" 形式で返す
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: getTimeZone(),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(d);
}

// 今日の "YYYY-MM-DD"（端末TZ基準）
export function todayStr(): string {
	return toDateStr(new Date());
}

// 前日の "YYYY-MM-DD"（端末TZ基準）
export function yesterdayStr(): string {
	return toDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

// "YYYY-MM-DD" → ロケール別の日付ラベル（曜日付き）
// ja: "2026/1/5（月）" / en: "Mon, Jan 5, 2026"
export function formatDateLabel(date: string): string {
	// カレンダー日付はTZ非依存。UTC固定で整形して日付がずれないようにする。
	const d = new Date(`${date}T00:00:00Z`);
	const locale = currentLocale();
	if (locale.startsWith("ja")) {
		const week = new Intl.DateTimeFormat("ja-JP", {
			weekday: "short",
			timeZone: "UTC",
		}).format(d);
		return `${date.slice(0, 4)}/${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}（${week}）`;
	}
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(d);
}

// "YYYY-MM-DD" → 長い日付表記
// ja: "2026年01月05日" / en: "January 5, 2026"
export function formatDateJp(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	const locale = currentLocale();
	if (locale.startsWith("ja")) {
		return `${date.slice(0, 4)}年${date.slice(5, 7)}月${date.slice(8, 10)}日`;
	}
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	}).format(d);
}

// Date（瞬間）→ 日付ラベル（曜日付き） + "HH:MM:SS"（端末TZの壁時計）
export function formatClock(d: Date): string {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: getTimeZone(),
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(d);
	const get = (type: string) =>
		parts.find((p) => p.type === type)?.value ?? "00";
	const time = `${get("hour")}:${get("minute")}:${get("second")}`;
	return `${formatDateLabel(toDateStr(d))} ${time}`;
}

// "HH:MM" → 0時からの経過分
export function hmToMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}

// Date（瞬間）→ 端末TZにおける 0時からの経過分（0–1439）
export function minutesOfDay(d: Date): number {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: getTimeZone(),
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(d);
	const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
	const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
	return h * 60 + m;
}
