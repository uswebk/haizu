import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

// 拠点はURLで表現するため、どの拠点を開くかはここでは決められない。
// 拠点選択画面へ送り、そこで /s/$siteId/... へ入る。
export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await fetchSession();
		throw redirect({ to: user ? "/select-site" : "/login" });
	},
	component: () => null,
});
