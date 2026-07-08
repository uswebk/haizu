import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await fetchSession();
		throw redirect({ to: user ? "/home" : "/login" });
	},
	component: () => null,
});
