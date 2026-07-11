import {
	canAccessScreen,
	landingScreen,
	type OrgRole,
	type Screen,
	type SiteRole,
} from "@haizu/shared";
import { redirect } from "@tanstack/react-router";

// Checks view permission for a site-scoped screen. If not permitted, redirect to that role's landing screen.
// The permission table's single source of truth is @haizu/shared, shared with the API's authorization.
// Decisions use "the effective role at the URL's site" (permissions differ per site).
export function assertScreen(
	orgRole: OrgRole,
	siteRole: SiteRole | null,
	siteId: string,
	screen: Screen,
) {
	if (canAccessScreen(orgRole, siteRole, screen)) return;

	const landing = landingScreen(orgRole, siteRole);
	if (landing === "account") throw redirect({ to: "/account" });
	throw redirect({
		to: landing === "home" ? "/s/$siteId/home" : "/s/$siteId/viewer",
		params: { siteId },
	});
}
