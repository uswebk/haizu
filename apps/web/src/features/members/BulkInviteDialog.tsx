import type { OrgRole } from "@haizu/shared";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { OptionCard } from "#/components/ui/OptionCard";
import { Table, type TableColumn } from "#/components/ui/Table";
import { useDismiss } from "#/hooks/useDismiss";
import { MAX_INVITE_ROWS, membersTemplateCsv, parseMembersCsv } from "./csv";
import {
	type InviteCsvEntry,
	type InvitePreview,
	type InvitePreviewRow,
	validateInvites,
} from "./importValidation";
import { SiteRolePicker } from "./SiteRolePicker";
import type { MemberRow, SiteRoleAssignment } from "./types";

export type BulkInviteValues = {
	members: InviteCsvEntry[];
	orgRole: OrgRole;
	siteRoles: SiteRoleAssignment[];
};

type Props = {
	open: boolean;
	canAssignAdmin: boolean;
	existingMembers: MemberRow[];
	isPending?: boolean;
	errorMessage?: string | null;
	onSubmit: (values: BulkInviteValues) => void;
	onCancel: () => void;
};

export function BulkInviteDialog({
	open,
	canAssignAdmin,
	existingMembers,
	isPending = false,
	errorMessage,
	onSubmit,
	onCancel,
}: Props) {
	const { t } = useTranslation(["members", "common"]);
	const contentRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	useDismiss(open, onCancel, contentRef);

	const [orgRole, setOrgRole] = useState<OrgRole>("member");
	const [siteRoles, setSiteRoles] = useState<SiteRoleAssignment[]>([]);
	const [preview, setPreview] = useState<InvitePreview | null>(null);
	const [fileName, setFileName] = useState("");
	const [fileError, setFileError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setOrgRole("member");
		setSiteRoles([]);
		setPreview(null);
		setFileName("");
		setFileError(null);
	}, [open]);

	if (!open) return null;

	const handleTemplate = () => {
		const blob = new Blob([membersTemplateCsv()], {
			type: "text/csv;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "haizu_members_template.csv";
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Reset the input so the same file can be selected again
		e.target.value = "";
		if (!file) return;
		const parsed = parseMembersCsv(await file.text());
		if (parsed.length > MAX_INVITE_ROWS) {
			setPreview(null);
			setFileName(file.name);
			setFileError(t("members:import.tooManyRows", { max: MAX_INVITE_ROWS }));
			return;
		}
		setFileError(null);
		setFileName(file.name);
		setPreview(validateInvites(parsed, existingMembers));
	};

	const columns: TableColumn<InvitePreviewRow>[] = [
		{
			key: "status",
			label: t("members:import.colResult"),
			width: "0.7fr",
			render: (r) => (
				<Badge tone={r.errors.length === 0 ? "success" : "warning"}>
					{r.errors.length === 0
						? t("members:import.ok")
						: t("members:import.error")}
				</Badge>
			),
		},
		{
			key: "name",
			label: t("members:import.colName"),
			width: "1fr",
			render: (r) => <span className="font-semibold">{r.name || "—"}</span>,
		},
		{
			key: "email",
			label: t("common:email"),
			width: "1.6fr",
			render: (r) => <span className="text-xs">{r.email || "—"}</span>,
		},
		{
			key: "detail",
			label: t("members:import.colDetail"),
			width: "1.6fr",
			render: (r) =>
				r.errors.length === 0 ? (
					<span className="text-xs text-faint">—</span>
				) : (
					<span className="text-xs text-warning leading-relaxed">
						{r.errors.join(" / ")}
					</span>
				),
		},
	];

	// A member always belongs to at least one site (with zero sites they can't enter any screen)
	const hasSite = orgRole === "admin" || siteRoles.length > 0;
	const validCount = preview?.validCount ?? 0;
	const canInvite = hasSite && validCount > 0;

	const handleSubmit = () => {
		if (!canInvite || !preview) return;
		onSubmit({
			members: preview.rows
				.map((r) => r.input)
				.filter((v): v is InviteCsvEntry => v !== null),
			orgRole,
			siteRoles: orgRole === "admin" ? [] : siteRoles,
		});
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-230 max-w-full max-h-[85vh] flex flex-col overflow-auto bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-7"
			>
				<div className="mb-6">
					<div className="text-lg font-bold">
						{t("members:bulkInvite.title")}
					</div>
					<div className="text-xs text-faint mt-0.75">
						{t("members:bulkInvite.subtitle")}
					</div>
				</div>

				{canAssignAdmin && (
					<>
						<div className="mb-2 text-xs font-semibold text-muted">
							{t("members:form.orgRole")}
						</div>
						<div className="flex flex-col gap-2 mb-4.5">
							<OptionCard
								title={t("members:form.orgRoleAdmin")}
								description={t("members:form.orgRoleAdminDesc")}
								selected={orgRole === "admin"}
								onClick={() => {
									setOrgRole("admin");
									setSiteRoles([]);
								}}
							/>
							<OptionCard
								title={t("members:form.orgRoleMember")}
								description={t("members:form.orgRoleMemberDesc")}
								selected={orgRole === "member"}
								onClick={() => setOrgRole("member")}
							/>
						</div>
					</>
				)}

				{orgRole === "admin" ? (
					<div className="mb-4.5 px-3.75 py-3.25 border border-border rounded-md bg-app-bg text-[12.5px] text-muted">
						{t("members:form.allSitesAccess")}
					</div>
				) : (
					<SiteRolePicker value={siteRoles} onChange={setSiteRoles} />
				)}

				<div className="mb-2 text-xs font-semibold text-muted">
					{t("members:bulkInvite.csvLabel")}
				</div>
				<div className="flex items-center gap-2.5 mb-4.5 flex-wrap">
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv,text/csv"
						className="hidden"
						onChange={handleFileSelected}
					/>
					<Button
						variant="secondary"
						onClick={() => fileInputRef.current?.click()}
					>
						{t("members:bulkInvite.selectFile")}
					</Button>
					<Button variant="secondary" onClick={handleTemplate}>
						{t("members:bulkInvite.downloadTemplate")}
					</Button>
					<span className="text-xs text-faint">
						{fileName || t("members:bulkInvite.noFile")}
					</span>
				</div>

				{preview && (
					<>
						<div className="flex items-center gap-2.5 mb-4">
							<Badge tone="success">
								{t("members:import.okCount", { count: preview.validCount })}
							</Badge>
							<Badge tone={preview.errorCount > 0 ? "warning" : "draft"}>
								{t("members:import.errorCount", { count: preview.errorCount })}
							</Badge>
						</div>

						<div className="overflow-auto flex-1 min-h-0">
							<Table
								columns={columns}
								rows={preview.rows}
								rowKey={(r) => r.line}
							/>
						</div>

						{preview.errorCount > 0 && (
							<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-4 leading-relaxed">
								{t("members:import.errorRowsSkipped")}
							</div>
						)}
					</>
				)}

				{(fileError || errorMessage) && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-4 leading-relaxed">
						{fileError ?? errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2.5 mt-6">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={handleSubmit} disabled={!canInvite || isPending}>
						{isPending
							? t("members:bulkInvite.inviting")
							: t("members:bulkInvite.inviteCount", { count: validCount })}
					</Button>
				</div>
			</div>
		</div>
	);
}
