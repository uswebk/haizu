// Timezone resolution. The deploy default is set via the VITE_DEFAULT_TIMEZONE env var (IANA name).
// If unset, falls back to the runtime TZ (process.env.TZ on the server,
// the browser's TZ on the client). For single-site factory/warehouse ops, fixing it via env var is the norm.

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
