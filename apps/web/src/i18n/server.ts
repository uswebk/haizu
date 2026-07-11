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

// SSR時の初期ロケールを Cookie（ユーザーの切替）→ 環境変数の既定 の順で解決する。
// クライアントの LanguageDetector と同じ結果になり、ハイドレーション不一致を防ぐ。
export const detectLocale = createServerFn({ method: "GET" }).handler(
	async (): Promise<Locale> => {
		const cookie = readCookie(
			getRequest().headers.get("cookie") ?? "",
			LOCALE_COOKIE,
		);
		return cookie ? normalizeLocale(cookie) : DEFAULT_LOCALE;
	},
);
