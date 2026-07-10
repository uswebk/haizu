import { displayRole } from "@haizu/shared";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSnackbar } from "#/contexts/snackbar-context";
import { MyProfileCard } from "#/features/members/MyProfileCard";
import type { MemberRow } from "#/features/members/types";
import { authClient } from "#/lib/auth-client";

// アカウント設定はユーザー単位の画面なので、拠点(/s/$siteId)の外に置く。
// 拠点に所属していないユーザーでも到達できる必要がある。
export const Route = createFileRoute("/_app/account")({
	component: AccountPage,
});

function AccountPage() {
	const { user } = Route.useRouteContext();
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
	// 拠点に依らないユーザー単位の画面のため、バッジは組織ロールだけで決める
	const badgeRole = displayRole(user.role, null) ?? "viewer";

	return (
		<div className="min-h-screen bg-app-bg">
			<header className="h-15.5 bg-surface border-b border-border flex items-center justify-between px-6 gap-4">
				<Link to="/" className="flex items-center gap-2.75">
					<img
						src="/logo.svg"
						alt="haizu"
						className="w-9.5 h-9.5 rounded-[10px]"
					/>
					<div className="font-bold text-xl leading-none text-ink">haizu</div>
				</Link>
				<Link
					to="/"
					className="text-[12.5px] font-semibold text-primary bg-primary-soft px-3 py-1.75 rounded-[8px]"
				>
					アプリに戻る
				</Link>
			</header>

			<div className="p-7">
				<div className="max-w-170 mx-auto">
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
		</div>
	);
}
