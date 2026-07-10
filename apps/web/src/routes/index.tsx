import { landingScreen } from "@haizu/shared";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const auth = await fetchSession();
		throw redirect({
			to: auth ? landingScreen(auth.user.role, auth.siteRole) : "/login",
		});
	},
	component: () => null,
});
