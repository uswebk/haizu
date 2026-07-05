import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "#/components/ui/EmptyState";

export const Route = createFileRoute("/_app/sites")({
	component: SitesPage,
});

function SitesPage() {
	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">拠点管理</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					事業所配下の拠点の一覧・追加・編集を行います。
				</div>

				<EmptyState
					className="mt-4.5"
					title="拠点管理は準備中です"
					hint="このページは今後実装予定です。"
				/>
			</div>
		</div>
	);
}
