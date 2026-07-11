import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

// Sites are expressed in the URL, so which site to open can't be decided here.
// Send to the site selection screen, and enter /s/$siteId/... from there.
export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await fetchSession();
		throw redirect({ to: user ? "/select-site" : "/login" });
	},
	component: () => null,
});
