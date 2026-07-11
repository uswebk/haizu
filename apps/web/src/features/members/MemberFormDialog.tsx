import { type OrgRole, SITE_ROLES, type SiteRole } from "@haizu/shared";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { OptionCard } from "#/components/ui/OptionCard";
import { useSite } from "#/contexts/site-context";
import { useDismiss } from "#/hooks/useDismiss";
import { useRoleLabel } from "#/lib/roles";
import type { MemberRow, SiteRoleAssignment } from "./types";

export type MemberFormValues = {
	lastName: string;
	firstName: string;
	email: string;
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
	isActive: boolean;
};

type Props = {
	open: boolean;
	mode: "invite" | "edit";
	canAssignAdmin: boolean;
	initialValue?: MemberRow;
	isPending?: boolean;
	errorMessage?: string | null;
	onSubmit: (data: MemberFormValues) => void;
	onCancel: () => void;
};

const SITE_ROLE_ORDER = SITE_ROLES;

function draftFromProps(
	mode: "invite" | "edit",
	initialValue: MemberRow | undefined,
	canAssignAdmin: boolean,
): MemberFormValues {
	if (mode === "edit" && initialValue) {
		return {
			lastName: "",
			firstName: "",
			email: initialValue.email,
			orgRole: canAssignAdmin ? initialValue.orgRole : "member",
			siteRoles: initialValue.allSites ? [] : [...initialValue.siteRoles],
			isActive: initialValue.status !== "inactive",
		};
	}
	return {
		lastName: "",
		firstName: "",
		email: "",
		orgRole: "member",
		siteRoles: [],
		isActive: true,
	};
}

export function MemberFormDialog({
	open,
	mode,
	canAssignAdmin,
	initialValue,
	isPending = false,
	errorMessage,
	onSubmit,
	onCancel,
}: Props) {
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	const { t } = useTranslation(["members", "common"]);
	const roleLabelFor = useRoleLabel();
	const { activeSites } = useSite();
	const assignableSites = activeSites.filter((s) => s.role === "site_admin");

	const [draft, setDraft] = useState<MemberFormValues>(() =>
		draftFromProps(mode, initialValue, canAssignAdmin),
	);

	useEffect(() => {
		if (open) setDraft(draftFromProps(mode, initialValue, canAssignAdmin));
	}, [open, mode, initialValue, canAssignAdmin]);

	if (!open) return null;

	// Remove the site assignment / add it with the default role (general)
	const toggleSite = (siteId: string) => {
		setDraft((d) => ({
			...d,
			siteRoles: d.siteRoles.some((s) => s.siteId === siteId)
				? d.siteRoles.filter((s) => s.siteId !== siteId)
				: [...d.siteRoles, { siteId, role: "general" }],
		}));
	};

	// A different role can be set per site (site A = site admin, site B = general, etc.)
	const setSiteRole = (siteId: string, role: SiteRole) => {
		setDraft((d) => ({
			...d,
			siteRoles: d.siteRoles.map((s) =>
				s.siteId === siteId ? { ...s, role } : s,
			),
		}));
	};

	// A member always belongs to at least one site (with zero sites they can't enter any screen)
	const hasSite = draft.orgRole === "admin" || draft.siteRoles.length > 0;
	const canSave =
		hasSite &&
		(mode === "edit" ||
			(draft.lastName.trim().length > 0 && draft.email.trim().length > 0));

	const handleSave = () => {
		if (!canSave) return;
		onSubmit({
			...draft,
			lastName: draft.lastName.trim(),
			firstName: draft.firstName.trim(),
			email: draft.email.trim(),
		});
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-130 max-w-full max-h-full overflow-auto bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-7"
			>
				<div className="mb-6">
					<div className="text-lg font-bold">
						{mode === "invite"
							? t("members:form.inviteTitle")
							: t("members:form.editTitle")}
					</div>
					<div className="text-xs text-faint mt-0.75">
						{mode === "invite"
							? t("members:form.inviteSubtitle")
							: `${initialValue?.name ?? ""}（${initialValue?.email ?? ""}）`}
					</div>
				</div>

				{mode === "invite" && (
					<>
						<div className="grid grid-cols-2 gap-3 mb-4.5">
							<Input
								label={t("members:form.lastName")}
								value={draft.lastName}
								onChange={(e) =>
									setDraft((d) => ({ ...d, lastName: e.target.value }))
								}
								placeholder={t("members:form.lastNamePlaceholder")}
							/>
							<Input
								label={t("members:form.firstName")}
								value={draft.firstName}
								onChange={(e) =>
									setDraft((d) => ({ ...d, firstName: e.target.value }))
								}
								placeholder={t("members:form.firstNamePlaceholder")}
							/>
						</div>

						<Input
							label={t("common:email")}
							value={draft.email}
							onChange={(e) =>
								setDraft((d) => ({ ...d, email: e.target.value }))
							}
							placeholder="name@haiz.co.jp"
							className="mb-4.5"
						/>
					</>
				)}

				{canAssignAdmin && (
					<>
						<div className="mb-2 text-xs font-semibold text-muted">
							{t("members:form.orgRole")}
						</div>
						<div className="flex flex-col gap-2 mb-4.5">
							<OptionCard
								title={t("members:form.orgRoleAdmin")}
								description={t("members:form.orgRoleAdminDesc")}
								selected={draft.orgRole === "admin"}
								onClick={() =>
									setDraft((d) => ({ ...d, orgRole: "admin", siteRoles: [] }))
								}
							/>
							<OptionCard
								title={t("members:form.orgRoleMember")}
								description={t("members:form.orgRoleMemberDesc")}
								selected={draft.orgRole === "member"}
								onClick={() => setDraft((d) => ({ ...d, orgRole: "member" }))}
							/>
						</div>
					</>
				)}

				{draft.orgRole === "admin" ? (
					<div className="mb-4.5 px-3.75 py-3.25 border border-border rounded-md bg-app-bg text-[12.5px] text-muted">
						{t("members:form.allSitesAccess")}
					</div>
				) : (
					<>
						<div className="mb-2 text-xs font-semibold text-muted">
							{t("members:form.siteRolesLabel")}
							<span className="text-faint font-medium">
								{t("members:form.siteRolesHint")}
							</span>
						</div>
						<div className="flex flex-col gap-2 mb-4.5">
							{assignableSites.map((site) => {
								const assigned = draft.siteRoles.find(
									(s) => s.siteId === site.id,
								);
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
													assigned
														? "font-bold text-ink"
														: "font-semibold text-muted"
												}`}
												title={site.name}
											>
												{site.name}
											</span>
										</button>

										{assigned && (
											<div className="flex flex-wrap gap-1.5 mt-2.5 pl-7">
												{SITE_ROLE_ORDER.map((role) => (
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

						{!hasSite && (
							<div className="-mt-2.5 mb-4.5 text-[12px] text-warning">
								{t("members:form.selectAtLeastOneSite")}
							</div>
						)}
					</>
				)}

				{mode === "edit" && (
					<button
						type="button"
						onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
						className="w-full flex items-center justify-between px-3.5 py-3 border border-border rounded-md cursor-pointer mb-6 text-left"
					>
						<div>
							<div className="text-[13.5px] font-semibold">
								{t("members:form.activateMember")}
							</div>
							<div className="text-[11.5px] text-faint">
								{t("members:form.suspendedCantLogin")}
							</div>
						</div>
						<div
							className="w-11 h-6.5 rounded-pill relative"
							style={{
								background: draft.isActive
									? "var(--color-primary)"
									: "var(--color-hairline)",
							}}
						>
							<div
								className="absolute top-0.75 w-5 h-5 rounded-full bg-white transition-[right,left]"
								style={draft.isActive ? { right: "3px" } : { left: "3px" }}
							/>
						</div>
					</button>
				)}

				{errorMessage && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mb-4 leading-relaxed">
						{errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2.5">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={handleSave} disabled={!canSave || isPending}>
						{isPending
							? t("members:form.saving")
							: mode === "invite"
								? t("members:form.invite")
								: t("members:form.save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
