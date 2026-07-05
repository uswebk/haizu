import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "#/components/ui/EmptyState";

export const Route = createFileRoute("/_app/organization-settings")({
	component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">事業所設定</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					事業所名など、事業所全体に関わる情報を管理します。
				</div>

				<EmptyState
					className="mt-4.5"
					title="事業所設定は準備中です"
					hint="このページは今後実装予定です。"
				/>
			</div>
		</div>
	);
}
