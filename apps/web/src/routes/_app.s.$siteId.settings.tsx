import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card } from "#/components/ui/Card";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/s/$siteId/settings")({
	beforeLoad: ({ context, params }) => {
		assertScreen(
			context.user.role,
			context.siteRole,
			params.siteId,
			"settings",
		);
	},
	component: SettingsLayout,
});

const SETTING_LINKS = [
	{ to: "/s/$siteId/settings/shifts" as const, key: "shifts" },
	{ to: "/s/$siteId/settings/tags" as const, key: "tags" },
	{ to: "/s/$siteId/settings/viewer" as const, key: "viewer" },
];

function SettingsLayout() {
	const matches = useMatches();
	const { t } = useTranslation("settings");
	const { siteId } = Route.useParams();
	const isHub =
		matches[matches.length - 1]?.routeId === "/_app/s/$siteId/settings";

	if (!isHub) return <Outlet />;

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">{t("hub.title")}</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					{t("hub.subtitle")}
				</div>

				<div className="flex flex-col gap-3 mt-4.5">
					{SETTING_LINKS.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							params={{ siteId }}
							className="block"
						>
							<Card className="hover:bg-app-bg transition-colors duration-150 cursor-pointer">
								<div className="font-bold text-[15px]">
									{t(`hub.${item.key}.title`)}
								</div>
								<div className="text-[13px] text-muted mt-1">
									{t(`hub.${item.key}.description`)}
								</div>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
