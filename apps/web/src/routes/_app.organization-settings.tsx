import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "#/components/ui/EmptyState";
import { OrganizationNameForm } from "#/features/organization/OrganizationNameForm";
import { OrgEmailChange } from "#/features/organization/OrgEmailChange";

export const Route = createFileRoute("/_app/organization-settings")({
	component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
	const { user } = Route.useRouteContext();

	if (user.role !== "admin") {
		return (
			<div className="p-7 overflow-auto h-full">
				<div className="max-w-170">
					<div className="text-[22px] font-bold">事業所設定</div>
					<EmptyState
						className="mt-4.5"
						title="この画面は管理者のみ利用できます"
						hint="事業所情報の変更は管理者権限が必要です。"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">事業所設定</div>
				<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
					事業所名など、事業所全体に関わる情報を管理します。
				</div>

				<OrganizationNameForm />
				<OrgEmailChange />
			</div>
		</div>
	);
}
