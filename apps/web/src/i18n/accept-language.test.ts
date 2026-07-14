import { describe, expect, it } from "vitest";
import { pickLocaleFromAcceptLanguage } from "./accept-language";

describe("pickLocaleFromAcceptLanguage", () => {
	it("picks a plain supported tag", () => {
		expect(pickLocaleFromAcceptLanguage("ja")).toBe("ja");
	});

	it("normalizes a region subtag", () => {
		expect(pickLocaleFromAcceptLanguage("ja-JP,ja;q=0.9,en;q=0.8")).toBe("ja");
		expect(pickLocaleFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
	});

	it("prefers the highest q value over header order", () => {
		expect(pickLocaleFromAcceptLanguage("ja;q=0.7,en;q=0.9")).toBe("en");
	});

	it("falls back to header order when q values tie", () => {
		expect(pickLocaleFromAcceptLanguage("en,ja")).toBe("en");
		expect(pickLocaleFromAcceptLanguage("ja,en")).toBe("ja");
	});

	it("skips unsupported languages", () => {
		expect(pickLocaleFromAcceptLanguage("fr-FR,fr;q=0.9,ja;q=0.5")).toBe("ja");
	});

	it("ignores languages explicitly refused with q=0", () => {
		expect(pickLocaleFromAcceptLanguage("ja;q=0,en;q=0.5")).toBe("en");
	});

	it("returns undefined when no supported language is requested", () => {
		expect(pickLocaleFromAcceptLanguage("fr,de;q=0.9")).toBeUndefined();
		expect(pickLocaleFromAcceptLanguage("*")).toBeUndefined();
		expect(pickLocaleFromAcceptLanguage("")).toBeUndefined();
		expect(pickLocaleFromAcceptLanguage(null)).toBeUndefined();
	});
});
