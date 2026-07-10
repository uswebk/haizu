import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { ROLE_LABEL } from "#/lib/roles";

export const Route = createFileRoute("/_app/members")({
	beforeLoad: ({ context }) => {
		assertScreen(context.user.role, context.siteRole, "members");
	},
	component: MemberList,
});

const STATUS_META: Record<
	MemberStatus,
	{ label: string; tone: "success" | "draft" | "warning" }
> = {
	active: { label: "アクティブ", tone: "success" },
	inactive: { label: "停止中", tone: "draft" },
	invited: { label: "招待中", tone: "warning" },
};

function MemberList() {
	const queryClient = useQueryClient();
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
				editingMember ? "メンバーを更新しました" : "メンバーを招待しました",
			);
		},
		onError: (error) => {
			setSaveError(
				error instanceof Error ? error.message : "保存に失敗しました",
			);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (id: string) => cancelInvitation(id),
		onSuccess: () => {
			void invalidate();
			showSuccess("招待を取り消しました");
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
			label: "メンバー",
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
			label: "権限",
			width: "1fr",
			render: (m) =>
				m.allSites ? (
					<RoleBadge role={roleBadgeKey("admin")} />
				) : (
					<span className="text-[12.5px] text-muted">メンバー</span>
				),
		},
		{
			key: "sites",
			label: "担当拠点と権限",
			width: "1.8fr",
			render: (m) => {
				if (m.allSites) return <span>全拠点</span>;
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
									{name}: {ROLE_LABEL[sr.role]}
								</span>
							);
						})}
					</div>
				);
			},
		},
		{
			key: "status",
			label: "状態",
			width: "1.1fr",
			render: (m) => (
				<div className="flex items-center justify-between gap-2">
					<Badge tone={STATUS_META[m.status].tone}>
						{STATUS_META[m.status].label}
					</Badge>
					{m.kind === "user" ? (
						<Button variant="secondary" size="sm" onClick={() => openEdit(m)}>
							編集
						</Button>
					) : (
						<Button
							variant="secondary"
							size="sm"
							disabled={cancelMutation.isPending}
							onClick={() => cancelMutation.mutate(m.id)}
						>
							取消
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
							メンバー{" "}
							<span className="text-sm text-faint font-semibold">
								（{activeCount} / {members.length}）
							</span>
						</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							haizuを利用するメンバーと権限・担当拠点を管理します。
						</div>
					</div>
				</div>

				<div className="mb-3.5 flex items-center gap-2.5">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="名前・メールで検索"
						className="min-w-55 w-70 max-w-full"
					/>
					<Button onClick={openInvite}>＋ メンバーを招待</Button>
				</div>

				<Table columns={columns} rows={filtered} rowKey={(m) => m.id} />
			</div>

			<MemberFormDialog
				open={dialogMode !== null}
				mode={dialogMode ?? "invite"}
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
