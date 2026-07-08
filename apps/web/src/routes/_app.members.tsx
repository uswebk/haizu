import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { RoleBadge } from "#/components/ui/RoleBadge";
import { Table, type TableColumn } from "#/components/ui/Table";
import { useSite } from "#/contexts/site-context";
import {
	MemberFormDialog,
	type MemberFormValues,
} from "#/features/members/MemberFormDialog";
import { MyProfileCard } from "#/features/members/MyProfileCard";
import { roleBadgeKey } from "#/features/members/roleBadgeKey";
import type { MemberRow, MemberStatus } from "#/features/members/types";
import {
	cancelInvitation,
	fetchMembers,
	inviteMember,
	memberKeys,
	updateMember,
} from "#/lib/api/members";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app/members")({
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
	const { activeSites } = useSite();
	const { data: session } = authClient.useSession();
	const { data: members = [] } = useQuery({
		queryKey: memberKeys.all,
		queryFn: fetchMembers,
	});

	const me = members.find(
		(m) => m.kind === "user" && m.email === session?.user.email,
	);
	const otherMembers = members.filter((m) => m.id !== me?.id);

	const updateNameMutation = useMutation({
		mutationFn: (name: string) => authClient.updateUser({ name }),
		onSuccess: () => void invalidate(),
	});

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
						role: data.role,
						siteIds: data.siteIds,
						isActive: data.isActive,
					})
				: inviteMember({
						lastName: data.lastName,
						firstName: data.firstName,
						email: data.email,
						role: data.role,
						siteIds: data.siteIds,
					}),
		onSuccess: () => {
			void invalidate();
			closeDialog();
		},
		onError: (error) => {
			setSaveError(
				error instanceof Error ? error.message : "保存に失敗しました",
			);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (id: string) => cancelInvitation(id),
		onSuccess: () => void invalidate(),
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
			render: (m) => <RoleBadge role={roleBadgeKey(m.role)} />,
		},
		{
			key: "sites",
			label: "担当拠点",
			width: "1.4fr",
			render: (m) => {
				if (m.allSites) return <span>全拠点</span>;
				const names = m.siteIds
					.map(siteName)
					.filter((n): n is string => n !== null);
				return <span>{names.length > 0 ? names.join("、") : "—"}</span>;
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
					<Button onClick={openInvite}>＋ メンバーを招待</Button>
				</div>

				{me && (
					<MyProfileCard
						member={me}
						isPending={updateNameMutation.isPending}
						onSaveName={(name) => updateNameMutation.mutate(name)}
					/>
				)}

				<div className="mb-3.5">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="名前・メールで検索"
						className="min-w-55 w-70 max-w-full"
					/>
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
