import { canAccessScreen, displayRole } from "@haizu/shared";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "#/components/ui/LanguageSwitcher";
import { NavItem } from "#/components/ui/NavItem";
import { SiteProvider, useSite } from "#/contexts/site-context";
import { useDismiss } from "#/hooks/useDismiss";
import { siteKeys } from "#/lib/api/sites";
import { authClient } from "#/lib/auth-client";
import { formatDateLabel, todayStr } from "#/lib/datetime";
import { useRoleLabel } from "#/lib/roles";
import { fetchSiteRole } from "#/lib/session";

// The previously shown site. Used only to detect cross-site navigation (client-only).
let lastSiteId: string | null = null;

// The current site's source of truth is the URL. Here we verify membership and the effective role and pass them to child routes.
export const Route = createFileRoute("/_app/s/$siteId")({
	beforeLoad: async ({ params, context }) => {
		const siteRole = await fetchSiteRole({ data: params.siteId });
		// Send nonexistent / inactive / non-member sites back to site selection
		if (!siteRole) throw redirect({ to: "/select-site" });

		// Right after switching sites, leftover cache from the previous site briefly shows old data, so discard it.
		// The site list (["sites"]) is organization-scoped, so exclude it.
		if (typeof window !== "undefined") {
			if (lastSiteId !== null && lastSiteId !== params.siteId) {
				context.queryClient.removeQueries({
					predicate: (query) => query.queryKey[0] !== siteKeys.all[0],
				});
			}
			lastSiteId = params.siteId;
		}
		return { siteRole };
	},
	component: SiteLayout,
});

function SiteLayout() {
	const { siteId } = Route.useParams();
	// When the site changes, the key changes so site-scoped state doesn't carry over
	return (
		<SiteProvider key={siteId} siteId={siteId}>
			<SiteLayoutInner />
		</SiteProvider>
	);
}

const MAIN_NAV = [
	{ to: "/s/$siteId/home", screen: "home" },
	{ to: "/s/$siteId/editor", screen: "editor" },
	{ to: "/s/$siteId/assignment", screen: "assignment" },
	{ to: "/s/$siteId/history", screen: "history" },
	{ to: "/s/$siteId/viewer", screen: "viewer" },
	{ to: "/s/$siteId/employees", screen: "employees" },
	{ to: "/s/$siteId/settings", screen: "settings" },
] as const;

const ADMIN_NAV = [
	{ to: "/s/$siteId/sites", screen: "sites" },
	{ to: "/s/$siteId/members", screen: "members" },
	{
		to: "/s/$siteId/organization-settings",
		screen: "organization-settings",
	},
] as const;

function SiteLayoutInner() {
	const { currentSite } = useSite();
	const navigate = useNavigate();
	const { user, siteRole } = Route.useRouteContext();
	const { siteId } = Route.useParams();
	const { t } = useTranslation(["nav", "layout", "common"]);
	const roleLabelFor = useRoleLabel();
	const userName = user.name;
	const userEmail = user.email;
	// Display uses "the effective role at the current site"
	const roleLabel = roleLabelFor(displayRole(user.role, siteRole) ?? "viewer");
	const initial = userName.charAt(0) || "?";

	const mainNav = MAIN_NAV.filter((i) =>
		canAccessScreen(user.role, siteRole, i.screen),
	);
	const adminNav = ADMIN_NAV.filter((i) =>
		canAccessScreen(user.role, siteRole, i.screen),
	);

	const todayLabel = formatDateLabel(todayStr());

	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	useDismiss(userMenuOpen, () => setUserMenuOpen(false), userMenuRef);

	const logout = async () => {
		await authClient.signOut();
		void navigate({ to: "/login" });
	};

	return (
		<div className="flex h-screen bg-app-bg overflow-hidden">
			<aside className="w-59 shrink-0 bg-surface border-r border-border flex flex-col py-4.5 px-3.5">
				<div className="flex items-center gap-2.75 px-1.5 pb-4.5">
					<img
						src="/logo.svg"
						alt="haizu"
						className="w-9.5 h-9.5 rounded-[10px]"
					/>
					<div>
						<div className="font-bold text-xl leading-none text-ink">haizu</div>
						<div className="font-mono text-[9.5px] tracking-[.13em] text-faint mt-1">
							{t("common:appTagline")}
						</div>
					</div>
				</div>

				<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2">
					{t("nav:siteManagement", { site: currentSite.name })}
				</div>
				{mainNav.map((item) => (
					<Link
						key={item.to}
						to={item.to}
						params={{ siteId }}
						className="block"
						activeOptions={{ exact: item.screen === "home" }}
					>
						{({ isActive }) => (
							<NavItem active={isActive}>{t(`nav:${item.screen}`)}</NavItem>
						)}
					</Link>
				))}

				{adminNav.length > 0 && (
					<>
						<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2 pt-4.5">
							{t("nav:orgManagement")}
						</div>
						{adminNav.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								params={{ siteId }}
								className="block"
							>
								{({ isActive }) => (
									<NavItem active={isActive}>{t(`nav:${item.screen}`)}</NavItem>
								)}
							</Link>
						))}
					</>
				)}

				<div className="mt-auto border-t border-hairline pt-3.5 pb-1 flex items-center gap-2.5 px-2">
					<div className="w-8.5 h-8.5 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm shrink-0">
						{initial}
					</div>
					<div className="min-w-0 flex-1">
						<div className="text-[13px] font-semibold truncate">{userName}</div>
						<div className="text-[11px] text-faint">{roleLabel}</div>
					</div>
				</div>
			</aside>

			<div className="flex-1 min-w-0 flex flex-col">
				<header className="h-15.5 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6 gap-4">
					<div className="flex items-center gap-2.25 border border-border rounded-[10px] px-3 py-1.75 bg-surface">
						<div className="w-2 h-2 rounded-[2px] bg-primary" />
						<span className="text-[13.5px] font-bold">{currentSite.name}</span>
						<Link
							to="/select-site"
							title={t("layout:switchSiteTitle")}
							className="text-[11.5px] font-bold text-primary bg-primary-soft px-2.25 py-1 rounded-[7px] cursor-pointer border-none"
						>
							{t("layout:switchSite")}
						</Link>
					</div>
					<div className="flex items-center gap-3.5">
						<span className="text-[13px] text-muted font-medium">
							{todayLabel}
						</span>
						<span className="text-[11.5px] font-bold text-ink bg-hairline px-2.75 py-1.25 rounded-pill leading-none">
							{roleLabel}
						</span>
						<div className="relative" ref={userMenuRef}>
							<button
								type="button"
								onClick={() => setUserMenuOpen((v) => !v)}
								className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm cursor-pointer border-none"
							>
								{initial}
							</button>
							{userMenuOpen && (
								<div className="absolute top-11.5 right-0 w-62 bg-surface border border-border rounded-[13px] shadow-float z-40 overflow-hidden">
									<div className="px-4 py-3.75 border-b border-hairline">
										<div className="text-sm font-bold">{userName}</div>
										<div className="text-xs text-faint mt-0.5">{userEmail}</div>
									</div>
									<div className="px-4 py-3 border-b border-hairline">
										<div className="text-[11px] text-faint font-semibold mb-1.5">
											{t("common:language")}
										</div>
										<LanguageSwitcher className="flex gap-1.5" />
									</div>
									<div className="p-1.5">
										<Link
											to="/account"
											search={{ site: siteId }}
											onClick={() => setUserMenuOpen(false)}
											className="block px-2.75 py-2.5 rounded-[9px] text-[13px] font-semibold hover:bg-app-bg"
										>
											{t("layout:accountSettings")}
										</Link>
										<button
											type="button"
											onClick={() => {
												setUserMenuOpen(false);
												void logout();
											}}
											className="w-full text-left px-2.75 py-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer border-none bg-transparent text-danger hover:bg-danger-soft"
										>
											{t("layout:logout")}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Content — each child page controls its own padding/scroll */}
				<main className="flex-1 min-h-0">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
