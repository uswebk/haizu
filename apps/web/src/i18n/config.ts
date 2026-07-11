import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const SUPPORTED_LOCALES = ["en", "ja"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_COOKIE = "i18next";

// The deploy default language is set via the VITE_DEFAULT_LOCALE env var (unset = "en").
// Users can override it with the language switcher, and their choice is saved to a cookie.
export const DEFAULT_LOCALE: Locale = toLocale(
	import.meta.env.VITE_DEFAULT_LOCALE,
	"en",
);

export const LOCALE_LABEL: Record<Locale, string> = {
	en: "English",
	ja: "日本語",
};

function toLocale(value: string | null | undefined, fallback: Locale): Locale {
	if (!value) return fallback;
	const base = value.toLowerCase().split("-")[0];
	return (SUPPORTED_LOCALES as readonly string[]).includes(base)
		? (base as Locale)
		: fallback;
}

// Normalize a string to a supported locale ("ja-JP" -> "ja"; unsupported -> default).
export function normalizeLocale(value: string | null | undefined): Locale {
	return toLocale(value, DEFAULT_LOCALE);
}

if (!i18n.isInitialized) {
	i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			resources: { en, ja },
			fallbackLng: DEFAULT_LOCALE,
			supportedLngs: SUPPORTED_LOCALES as unknown as string[],
			defaultNS: "common",
			interpolation: { escapeValue: false },
			// The default is the env var (fallbackLng). Once the user switches, the cookie takes priority.
			// No browser-language auto-detection; the default is made deterministic via the env var.
			detection: {
				order: ["cookie", "htmlTag"],
				caches: ["cookie"],
				lookupCookie: LOCALE_COOKIE,
			},
		});
}

export default i18n;
