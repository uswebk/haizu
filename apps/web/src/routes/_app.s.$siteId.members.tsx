import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { RoleBadge } from "#/components/ui/RoleBadge";
import { Table, type TableColumn } from "#/components/ui/Table";
import { useSite } from "#/contexts/site-context";
import { useSnackbar } from "#/contexts/snackbar-context";
import {
	MemberFormDialog,
	type MemberFormValues,
} from "#/features/members/MemberFormDialog";
import { roleBadgeKey } from "#/features/members/roleBadgeKey";
import type { MemberRow, MemberStatus } from "#/features/members/types";
import {
	cancelInvitation,
	fetchMembers,
	inviteMember,
	memberKeys,
	updateMember,
} from "#/lib/api/members";
import { assertScreen } from "#/lib/guards";
import { useRoleLabel } from "#/lib/roles";

export const Route = createFileRoute("/_app/s/$siteId/members")({
	beforeLoad: ({ context, params }) => {
		assertScreen(context.user.role, context.siteRole, params.siteId, "members");
	},
	component: MemberList,
});

const STATUS_TONE: Record<MemberStatus, "success" | "draft" | "warning"> = {
	active: "success",
	inactive: "draft",
	invited: "warning",
};

function MemberList() {
	const queryClient = useQueryClient();
	const { t } = useTranslation(["members", "common"]);
	const roleLabelFor = useRoleLabel();
	const { showSuccess } = useSnackbar();
	const { activeSites } = useSite();
	const { user } = Route.useRouteContext();
	const { data: members = [] } = useQuery({
		queryKey: memberKeys.all,
		queryFn: fetchMembers,
	});

	const me = members.find((m) => m.kind === "user" && m.email === user.email);
	const otherMembers = members.filter((m) => m.id !== me?.id);

	const [search, setSearch] = useState("");
	const [dialogMode, setDialogMode] = useState<"invite" | "edit" | null>(null);
	const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: memberKeys.all });

	const saveMutation = useMutation({
		mutationFn: (data: MemberFormValues) =>
			editingMember
				? updateMember(editingMember.id, {
						orgRole: data.orgRole,
						siteRoles: data.siteRoles,
						isActive: data.isActive,
					})
				: inviteMember({
						lastName: data.lastName,
						firstName: data.firstName,
						email: data.email,
						orgRole: data.orgRole,
						siteRoles: data.siteRoles,
					}),
		onSuccess: () => {
			void invalidate();
			closeDialog();
			showSuccess(
				editingMember ? t("members:list.updated") : t("members:list.invited"),
			);
		},
		onError: (error) => {
			setSaveError(
				error instanceof Error ? error.message : t("members:list.saveFailed"),
			);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (id: string) => cancelInvitation(id),
		onSuccess: () => {
			void invalidate();
			showSuccess(t("members:list.invitationCanceled"));
		},
	});

	const siteName = (id: string) =>
		activeSites.find((s) => s.id === id)?.name ?? null;

	const openInvite = () => {
		setEditingMember(null);
		setSaveError(null);
		setDialogMode("invite");
	};

	const openEdit = (member: MemberRow) => {
		setEditingMember(member);
		setSaveError(null);
		setDialogMode("edit");
	};

	const closeDialog = () => {
		setDialogMode(null);
		setEditingMember(null);
		setSaveError(null);
	};

	const filtered = useMemo(() => {
		const q = search.trim();
		if (!q) return otherMembers;
		return otherMembers.filter((m) => `${m.name}${m.email}`.includes(q));
	}, [otherMembers, search]);

	const activeCount = members.filter((m) => m.status === "active").length;

	const columns: TableColumn<MemberRow>[] = [
		{
			key: "member",
			label: t("members:list.colMember"),
			width: "2fr",
			render: (m) => (
				<div className="min-w-0">
					<div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
						{m.name}
					</div>
					<div className="text-xs text-faint whitespace-nowrap overflow-hidden text-ellipsis">
						{m.email}
					</div>
				</div>
			),
		},
		{
			key: "role",
			label: t("members:list.colRole"),
			width: "1fr",
			render: (m) =>
				m.allSites ? (
					<RoleBadge role={roleBadgeKey("admin")} />
				) : (
					<span className="text-[12.5px] text-muted">
						{t("members:form.orgRoleMember")}
					</span>
				),
		},
		{
			key: "sites",
			label: t("members:list.colSites"),
			width: "1.8fr",
			render: (m) => {
				if (m.allSites) return <span>{t("members:list.allSites")}</span>;
				if (m.siteRoles.length === 0) return <span>—</span>;
				// 拠点ごとに権限が異なりうるため「拠点名: 権限」で並べる
				return (
					<div className="flex flex-wrap gap-1.5">
						{m.siteRoles.map((sr) => {
							const name = siteName(sr.siteId);
							if (!name) return null;
							return (
								<span
									key={sr.siteId}
									className="text-[11.5px] text-muted bg-hairline rounded-pill px-2 py-0.75"
								>
									{name}: {roleLabelFor(sr.role)}
								</span>
							);
						})}
					</div>
				);
			},
		},
		{
			key: "status",
			label: t("members:list.colStatus"),
			width: "1.1fr",
			render: (m) => (
				<div className="flex items-center justify-between gap-2">
					<Badge tone={STATUS_TONE[m.status]}>
						{t(`members:status.${m.status}`)}
					</Badge>
					{m.kind === "user" ? (
						<Button variant="secondary" size="sm" onClick={() => openEdit(m)}>
							{t("common:edit")}
						</Button>
					) : (
						<Button
							variant="secondary"
							size="sm"
							disabled={cancelMutation.isPending}
							onClick={() => cancelMutation.mutate(m.id)}
						>
							{t("members:list.cancel")}
						</Button>
					)}
				</div>
			),
		},
	];

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-230">
				<div className="flex items-end justify-between gap-5 mb-4.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">
							{t("members:list.title")}{" "}
							<span className="text-sm text-faint font-semibold">
								（{activeCount} / {members.length}）
							</span>
						</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							{t("members:list.subtitle")}
						</div>
					</div>
				</div>

				<div className="mb-3.5 flex items-center gap-2.5">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("members:list.searchPlaceholder")}
						className="min-w-55 w-70 max-w-full"
					/>
					<Button onClick={openInvite}>{t("members:list.inviteButton")}</Button>
				</div>

				<Table columns={columns} rows={filtered} rowKey={(m) => m.id} />
			</div>

			<MemberFormDialog
				open={dialogMode !== null}
				mode={dialogMode ?? "invite"}
				canAssignAdmin={user.role === "admin"}
				initialValue={editingMember ?? undefined}
				isPending={saveMutation.isPending}
				errorMessage={saveError}
				onSubmit={(data) => {
					setSaveError(null);
					saveMutation.mutate(data);
				}}
				onCancel={closeDialog}
			/>
		</div>
	);
}
