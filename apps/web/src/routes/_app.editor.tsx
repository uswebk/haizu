import { createFileRoute, Outlet } from "@tanstack/react-router";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/editor")({
	beforeLoad: ({ context }) => {
		assertScreen(context.user.role, context.siteRole, "editor");
	},
	component: () => <Outlet />,
});
