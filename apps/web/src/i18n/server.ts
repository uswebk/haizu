import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { pickLocaleFromAcceptLanguage } from "./accept-language";
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE,
	type Locale,
	normalizeLocale,
} from "./config";

function readCookie(header: string, name: string): string | undefined {
	for (const part of header.split(";")) {
		const [k, ...v] = part.trim().split("=");
		if (k === name) return decodeURIComponent(v.join("="));
	}
	return undefined;
}

// Resolve the initial SSR locale in order: cookie (the user's switch) -> Accept-Language
// (the browser's language) -> the env-var default.
// The result is rendered as <html lang> in __root, and the client's LanguageDetector reads it back
// via htmlTag, so both sides agree and hydration doesn't mismatch.
export const detectLocale = createServerFn({ method: "GET" }).handler(
	async (): Promise<Locale> => {
		const headers = getRequest().headers;
		const cookie = readCookie(headers.get("cookie") ?? "", LOCALE_COOKIE);
		if (cookie) return normalizeLocale(cookie);
		return (
			pickLocaleFromAcceptLanguage(headers.get("accept-language")) ??
			DEFAULT_LOCALE
		);
	},
);
