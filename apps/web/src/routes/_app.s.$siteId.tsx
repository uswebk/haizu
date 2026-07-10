import { canAccessScreen, displayRole } from "@haizu/shared";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
import { NavItem } from "#/components/ui/NavItem";
import { SiteProvider, useSite } from "#/contexts/site-context";
import { useDismiss } from "#/hooks/useDismiss";
import { siteKeys } from "#/lib/api/sites";
import { authClient } from "#/lib/auth-client";
import { formatDateLabel, todayStr } from "#/lib/datetime";
import { ROLE_LABEL } from "#/lib/roles";
import { fetchSiteRole } from "#/lib/session";

// 直前に表示していた拠点。拠点をまたいだ遷移の検出だけに使う（クライアント限定）。
let lastSiteId: string | null = null;

// 現在の拠点はURLが真実。ここで所属と実効ロールを検証し、子ルートへ渡す。
export const Route = createFileRoute("/_app/s/$siteId")({
	beforeLoad: async ({ params, context }) => {
		const siteRole = await fetchSiteRole({ data: params.siteId });
		// 存在しない・非アクティブ・所属していない拠点は拠点選択へ戻す
		if (!siteRole) throw redirect({ to: "/select-site" });

		// 拠点が変わった直後に前拠点のキャッシュが残ると一瞬前データが見えるため破棄する。
		// 拠点一覧(["sites"])は組織スコープなので除外する。
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
	// 拠点が変わると key が変わり、拠点スコープの状態が持ち越されない
	return (
		<SiteProvider key={siteId} siteId={siteId}>
			<SiteLayoutInner />
		</SiteProvider>
	);
}

const MAIN_NAV = [
	{ label: "ホーム", to: "/s/$siteId/home", screen: "home" },
	{ label: "配置エリア", to: "/s/$siteId/editor", screen: "editor" },
	{ label: "配置決め", to: "/s/$siteId/assignment", screen: "assignment" },
	{ label: "配置履歴", to: "/s/$siteId/history", screen: "history" },
	{ label: "ビュアー", to: "/s/$siteId/viewer", screen: "viewer" },
	{ label: "従業員", to: "/s/$siteId/employees", screen: "employees" },
	{ label: "設定", to: "/s/$siteId/settings", screen: "settings" },
] as const;

const ADMIN_NAV = [
	{ label: "拠点管理", to: "/s/$siteId/sites", screen: "sites" },
	{ label: "メンバー", to: "/s/$siteId/members", screen: "members" },
	{
		label: "事業所設定",
		to: "/s/$siteId/organization-settings",
		screen: "organization-settings",
	},
] as const;

function SiteLayoutInner() {
	const { currentSite } = useSite();
	const navigate = useNavigate();
	const { user, siteRole } = Route.useRouteContext();
	const { siteId } = Route.useParams();
	const userName = user.name;
	const userEmail = user.email;
	// 表示は「現在拠点における実効ロール」
	const roleLabel = ROLE_LABEL[displayRole(user.role, siteRole) ?? "viewer"];
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
							配置管理SYSTEM
						</div>
					</div>
				</div>

				<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2">
					{currentSite.name}管理
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
							<NavItem active={isActive}>{item.label}</NavItem>
						)}
					</Link>
				))}

				{adminNav.length > 0 && (
					<>
						<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2 pt-4.5">
							事業所管理
						</div>
						{adminNav.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								params={{ siteId }}
								className="block"
							>
								{({ isActive }) => (
									<NavItem active={isActive}>{item.label}</NavItem>
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
							title="拠点を切り替え"
							className="text-[11.5px] font-bold text-primary bg-primary-soft px-2.25 py-1 rounded-[7px] cursor-pointer border-none"
						>
							切り替え
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
									<div className="p-1.5">
										<Link
											to="/account"
											search={{ site: siteId }}
											onClick={() => setUserMenuOpen(false)}
											className="block px-2.75 py-2.5 rounded-[9px] text-[13px] font-semibold hover:bg-app-bg"
										>
											アカウント設定
										</Link>
										<button
											type="button"
											onClick={() => {
												setUserMenuOpen(false);
												void logout();
											}}
											className="w-full text-left px-2.75 py-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer border-none bg-transparent text-danger hover:bg-danger-soft"
										>
											ログアウト
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
