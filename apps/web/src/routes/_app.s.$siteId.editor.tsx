import { createFileRoute, Outlet } from "@tanstack/react-router";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/s/$siteId/editor")({
	beforeLoad: ({ context, params }) => {
		assertScreen(context.user.role, context.siteRole, params.siteId, "editor");
	},
	component: () => <Outlet />,
});
