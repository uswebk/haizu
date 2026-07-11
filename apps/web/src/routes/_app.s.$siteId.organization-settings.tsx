import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EmptyState } from "#/components/ui/EmptyState";
import { OrganizationNameForm } from "#/features/organization/OrganizationNameForm";
import { OrgEmailChange } from "#/features/organization/OrgEmailChange";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/s/$siteId/organization-settings")({
	beforeLoad: ({ context, params }) => {
		assertScreen(
			context.user.role,
			context.siteRole,
			params.siteId,
			"organization-settings",
		);
	},
	component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
	const { user } = Route.useRouteContext();
	const { t } = useTranslation("orgSettings");

	if (user.role !== "admin") {
		return (
			<div className="p-7 overflow-auto h-full">
				<div className="max-w-170">
					<div className="text-[22px] font-bold">{t("title")}</div>
					<EmptyState
						className="mt-4.5"
						title={t("adminOnlyTitle")}
						hint={t("adminOnlyHint")}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">{t("title")}</div>
				<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
					{t("subtitle")}
				</div>

				<OrganizationNameForm />
				<OrgEmailChange />
			</div>
		</div>
	);
}
