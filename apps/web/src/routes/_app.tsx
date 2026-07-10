import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

// 認証済みエリアの共通ガード。拠点スコープの解決とレイアウトは /_app/s/$siteId が担う。
export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const user = await fetchSession();
		if (!user) throw redirect({ to: "/login" });
		// メールアドレス未確認ならOTP確認画面へ
		if (!user.emailVerified) throw redirect({ to: "/verify-otp" });
		return { user };
	},
	component: () => <Outlet />,
});
