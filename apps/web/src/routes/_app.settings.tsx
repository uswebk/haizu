import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { Card } from "#/components/ui/Card";

export const Route = createFileRoute("/_app/settings")({
	component: SettingsLayout,
});

const SETTING_LINKS = [
	{
		to: "/settings/shifts" as const,
		title: "働き方（シフト）設定",
		description: "この拠点のシフト区分（名前・時間帯）を管理します。",
	},
	{
		to: "/settings/tags" as const,
		title: "タグ管理",
		description: "従業員に付与するタグの追加・編集・削除を行います。",
	},
];

function SettingsLayout() {
	const matches = useMatches();
	const isHub = matches[matches.length - 1]?.routeId === "/_app/settings";

	if (!isHub) return <Outlet />;

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">設定</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					拠点の運用に関する各種設定はこちらから行えます。
				</div>

				<div className="flex flex-col gap-3 mt-4.5">
					{SETTING_LINKS.map((item) => (
						<Link key={item.to} to={item.to} className="block">
							<Card className="hover:bg-app-bg transition-colors duration-150 cursor-pointer">
								<div className="font-bold text-[15px]">{item.title}</div>
								<div className="text-[13px] text-muted mt-1">
									{item.description}
								</div>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
