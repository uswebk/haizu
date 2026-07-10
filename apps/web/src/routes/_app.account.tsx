import { displayRole } from "@haizu/shared";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSnackbar } from "#/contexts/snackbar-context";
import { MyProfileCard } from "#/features/members/MyProfileCard";
import type { MemberRow } from "#/features/members/types";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app/account")({
	component: AccountPage,
});

function AccountPage() {
	const { user, siteRole } = Route.useRouteContext();
	const router = useRouter();
	const { showSuccess } = useSnackbar();

	const updateNameMutation = useMutation({
		mutationFn: (name: string) => authClient.updateUser({ name }),
		onSuccess: async () => {
			await router.invalidate();
			showSuccess("名前を更新しました");
		},
	});

	const me: MemberRow = {
		id: user.id,
		kind: "user",
		name: user.name,
		email: user.email,
		orgRole: user.role,
		siteRoles: [],
		allSites: user.role === "admin",
		status: user.isActive ? "active" : "inactive",
	};
	// 拠点未所属でも自身の情報は変更できる。バッジは所属が無ければ「その他」相当を出す。
	const badgeRole = displayRole(user.role, siteRole) ?? "viewer";

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<div className="text-[22px] font-bold">アカウント設定</div>
				<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
					名前・メールアドレス・パスワードを変更します。
				</div>

				<MyProfileCard
					member={me}
					displayRole={badgeRole}
					isPending={updateNameMutation.isPending}
					onSaveName={(name) => updateNameMutation.mutate(name)}
				/>
			</div>
		</div>
	);
}
