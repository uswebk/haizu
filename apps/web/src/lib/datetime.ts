// Date/time formatting and conversion utilities (centralized so they don't scatter across the app)
// "Today" and the clock follow the viewer's device timezone (getTimeZone).
// Calendar dates (YYYY-MM-DD) carry no timezone, so they are formatted in fixed UTC
// when displayed, to avoid timezone-induced date shifts.

import i18n from "#/i18n/config";
import { getTimeZone } from "#/lib/timezone";

// Current locale ("ja" / "en"). Display formatters follow this.
function currentLocale(): string {
	return i18n.resolvedLanguage ?? i18n.language ?? "en";
}

// Date (instant) -> "YYYY-MM-DD" in the device timezone
export function toDateStr(d: Date): string {
	// en-CA returns the "YYYY-MM-DD" format
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: getTimeZone(),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(d);
}

// Today as "YYYY-MM-DD" (device-TZ based)
export function todayStr(): string {
	return toDateStr(new Date());
}

// The given instant offset by whole days, as "YYYY-MM-DD" (device-TZ based)
export function addDaysStr(d: Date, days: number): string {
	return toDateStr(new Date(d.getTime() + days * 24 * 60 * 60 * 1000));
}

// Previous day as "YYYY-MM-DD" (device-TZ based)
export function yesterdayStr(): string {
	return addDaysStr(new Date(), -1);
}

// "YYYY-MM-DD" -> locale-specific date label (with weekday)
// ja: "2026/1/5 (Mon)" / en: "Mon, Jan 5, 2026"
export function formatDateLabel(date: string): string {
	// Calendar dates are timezone-independent. Format in fixed UTC so the date doesn't shift.
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

// "YYYY-MM-DD" -> long date form
// ja: "2026-01-05" / en: "January 5, 2026"
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

// Date (instant) -> date label (with weekday) + "HH:MM:SS" (device-TZ wall clock)
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

// "HH:MM" -> minutes since midnight
export function hmToMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}

// Date (instant) -> minutes since midnight in the device timezone (0-1439)
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
