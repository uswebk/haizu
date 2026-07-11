import { useTranslation } from "react-i18next";
import { LOCALE_LABEL, type Locale, SUPPORTED_LOCALES } from "#/i18n/config";

// Language switcher. i18next's LanguageDetector caches to a cookie, so the choice persists.
export function LanguageSwitcher({ className }: { className?: string }) {
	const { i18n } = useTranslation();
	const current = (i18n.resolvedLanguage ?? i18n.language) as Locale;

	return (
		<div className={className}>
			{SUPPORTED_LOCALES.map((locale) => (
				<button
					key={locale}
					type="button"
					onClick={() => void i18n.changeLanguage(locale)}
					className={`flex-1 px-2.75 py-1.5 rounded-[7px] text-[12px] font-semibold cursor-pointer border-none ${
						current === locale
							? "bg-primary-soft text-primary"
							: "bg-transparent text-muted hover:bg-app-bg"
					}`}
				>
					{LOCALE_LABEL[locale]}
				</button>
			))}
		</div>
	);
}
