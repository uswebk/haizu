import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchSession } from "#/lib/session";

// Common guard for authenticated areas. Site-scope resolution and layout are handled by /_app/s/$siteId.
export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const user = await fetchSession();
		if (!user) throw redirect({ to: "/login" });
		// If the email isn't verified, go to the OTP verification screen
		if (!user.emailVerified) throw redirect({ to: "/verify-otp" });
		return { user };
	},
	component: () => <Outlet />,
});
