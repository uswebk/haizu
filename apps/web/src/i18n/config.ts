import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const SUPPORTED_LOCALES = ["en", "ja"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_COOKIE = "i18next";

// デプロイ既定の言語は環境変数 VITE_DEFAULT_LOCALE で設定する（未設定は "en"）。
// ユーザーは言語切替UIで上書きでき、その選択は Cookie に保存される。
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

// 指定文字列を対応ロケールに正規化する（"ja-JP" → "ja"、未対応 → デフォルト）。
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
			// 既定は環境変数（fallbackLng）。ユーザーが切り替えたら Cookie を優先する。
			// ブラウザ言語の自動判定は行わず、既定を環境変数で決定的にする。
			detection: {
				order: ["cookie", "htmlTag"],
				caches: ["cookie"],
				lookupCookie: LOCALE_COOKIE,
			},
		});
}

export default i18n;
