import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { I18nextProvider } from "react-i18next";

import { SnackbarProvider } from "#/contexts/snackbar-context";
import i18n, { DEFAULT_LOCALE, type Locale } from "#/i18n/config";
import { detectLocale } from "#/i18n/server";
import appCss from "../styles.css?url";

// QueryClientProvider は setupRouterSsrQueryIntegration がリクエスト単位の
// QueryClient で自動的に差し込む（ここで手動ラップ＋シングルトンにしない）。
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		component: () => <Outlet />,
		loader: async (): Promise<{ locale: Locale }> => {
			if (import.meta.env.SSR) {
				const locale = await detectLocale();
				await i18n.changeLanguage(locale);
				return { locale };
			}
			return { locale: (i18n.language as Locale) ?? DEFAULT_LOCALE };
		},
		head: () => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: "haizu",
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
			],
		}),
		shellComponent: RootDocument,
	},
);

function RootDocument({ children }: { children: React.ReactNode }) {
	const { locale } = Route.useLoaderData();
	return (
		<html lang={locale}>
			<head>
				<HeadContent />
			</head>
			<body>
				<I18nextProvider i18n={i18n}>
					<SnackbarProvider>{children}</SnackbarProvider>
				</I18nextProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
