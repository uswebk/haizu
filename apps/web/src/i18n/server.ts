import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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

// Resolve the initial SSR locale in order: cookie (user's switch) -> the env-var default.
// This matches the client's LanguageDetector result and prevents hydration mismatches.
export const detectLocale = createServerFn({ method: "GET" }).handler(
	async (): Promise<Locale> => {
		const cookie = readCookie(
			getRequest().headers.get("cookie") ?? "",
			LOCALE_COOKIE,
		);
		return cookie ? normalizeLocale(cookie) : DEFAULT_LOCALE;
	},
);
