import { SITE_ROLES, type SiteRole } from "@haizu/shared";
import { useTranslation } from "react-i18next";
import { useSite } from "#/contexts/site-context";
import { useRoleLabel } from "#/lib/roles";
import type { SiteRoleAssignment } from "./types";

type Props = {
	value: SiteRoleAssignment[];
	onChange: (next: SiteRoleAssignment[]) => void;
};

export function SiteRolePicker({ value, onChange }: Props) {
	const { t } = useTranslation(["members"]);
	const roleLabelFor = useRoleLabel();
	const { activeSites } = useSite();
	const assignableSites = activeSites.filter((s) => s.role === "site_admin");

	// Remove the site assignment / add it with the default role (general)
	const toggleSite = (siteId: string) => {
		onChange(
			value.some((s) => s.siteId === siteId)
				? value.filter((s) => s.siteId !== siteId)
				: [...value, { siteId, role: "general" }],
		);
	};

	// A different role can be set per site (site A = site admin, site B = general, etc.)
	const setSiteRole = (siteId: string, role: SiteRole) => {
		onChange(value.map((s) => (s.siteId === siteId ? { ...s, role } : s)));
	};

	return (
		<>
			<div className="mb-2 text-xs font-semibold text-muted">
				{t("members:form.siteRolesLabel")}
				<span className="text-faint font-medium">
					{t("members:form.siteRolesHint")}
				</span>
			</div>
			<div className="flex flex-col gap-2 mb-4.5">
				{assignableSites.map((site) => {
					const assigned = value.find((s) => s.siteId === site.id);
					return (
						<div
							key={site.id}
							className={`px-3.25 py-2.75 border rounded-md ${
								assigned ? "border-primary" : "border-border"
							}`}
						>
							{/* Site selection is a checkbox; keep its color role separate from the permission selection (primary) */}
							<button
								type="button"
								onClick={() => toggleSite(site.id)}
								className="w-full flex items-center gap-2.5 cursor-pointer border-none bg-transparent p-0 text-left"
							>
								<span
									className={`w-4.5 h-4.5 shrink-0 rounded-[5px] border flex items-center justify-center text-[11px] leading-none ${
										assigned
											? "bg-ink border-ink text-white"
											: "bg-surface border-border text-transparent"
									}`}
								>
									✓
								</span>
								<span
									className={`text-[13px] min-w-0 truncate ${
										assigned ? "font-bold text-ink" : "font-semibold text-muted"
									}`}
									title={site.name}
								>
									{site.name}
								</span>
							</button>

							{assigned && (
								<div className="flex flex-wrap gap-1.5 mt-2.5 pl-7">
									{SITE_ROLES.map((role) => (
										<button
											key={role}
											type="button"
											title={t(`members:siteRoleDesc.${role}`)}
											onClick={() => setSiteRole(site.id, role)}
											className={`text-[12px] px-2.5 py-1.5 rounded-sm border cursor-pointer whitespace-nowrap ${
												assigned.role === role
													? "font-bold border-primary text-primary bg-primary-soft"
													: "font-semibold border-border text-muted bg-surface"
											}`}
										>
											{roleLabelFor(role)}
										</button>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{value.length === 0 && (
				<div className="-mt-2.5 mb-4.5 text-[12px] text-warning">
					{t("members:form.selectAtLeastOneSite")}
				</div>
			)}
		</>
	);
}
