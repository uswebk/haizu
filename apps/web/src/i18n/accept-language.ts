import { type Locale, SUPPORTED_LOCALES } from "./config";

// Pick the most preferred supported locale from an Accept-Language header
// ("ja,en-US;q=0.9,en;q=0.8"). Returns undefined when the header requests no supported language,
// so the caller can fall back to the deploy default.
export function pickLocaleFromAcceptLanguage(
	header: string | null | undefined,
): Locale | undefined {
	if (!header) return undefined;

	const ranked = header
		.split(",")
		.map((part, index) => {
			const [tag, ...params] = part.trim().split(";");
			const q = params
				.map((p) => p.trim())
				.find((p) => p.toLowerCase().startsWith("q="))
				?.slice(2);
			const quality = q === undefined ? 1 : Number.parseFloat(q);
			return {
				base: tag.trim().toLowerCase().split("-")[0],
				quality: Number.isNaN(quality) ? 0 : quality,
				// Keeps the sort stable for equal q values, where header order is the preference.
				index,
			};
		})
		.filter((entry) => entry.quality > 0)
		.sort((a, b) => b.quality - a.quality || a.index - b.index);

	return ranked.find(
		(entry): entry is (typeof ranked)[number] & { base: Locale } =>
			(SUPPORTED_LOCALES as readonly string[]).includes(entry.base),
	)?.base;
}
