import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { NavItem } from "#/components/ui/NavItem";
import { useDismiss } from "#/hooks/useDismiss";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

const MAIN_NAV = [
	{ label: "ホーム", to: "/home" as const },
	{ label: "配置エリア", to: "/editor" as const },
	{ label: "配置決め", to: "/assignment" as const },
	{ label: "配置履歴", to: "/history" as const },
	{ label: "ビュアー", to: "/viewer" as const },
];

const ADMIN_NAV = [
	{ label: "従業員", to: "/employees" as const },
	{ label: "メンバー", to: "/members" as const },
	{ label: "設定", to: "/settings" as const },
];

function AppLayout() {
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	useDismiss(userMenuOpen, () => setUserMenuOpen(false), userMenuRef);

	return (
		<div className="flex h-screen bg-app-bg overflow-hidden">
			{/* Sidebar */}
			<aside className="w-59 shrink-0 bg-surface border-r border-border flex flex-col py-4.5 px-3.5">
				<div className="flex items-center gap-2.75 px-1.5 pb-4.5">
					<img
						src="/haiz-mark.png"
						alt="haiz"
						className="w-9.5 h-9.5 rounded-[10px]"
					/>
					<div>
						<div className="font-bold text-xl leading-none text-ink">haiz</div>
						<div className="font-mono text-[9.5px] tracking-[.13em] text-faint mt-1">
							配置管理SYSTEM
						</div>
					</div>
				</div>

				<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2">
					メイン
				</div>
				{MAIN_NAV.map((item) => (
					<Link
						key={item.to}
						to={item.to}
						className="block"
						activeOptions={{ exact: item.to === "/home" }}
					>
						{({ isActive }) => (
							<NavItem active={isActive}>{item.label}</NavItem>
						)}
					</Link>
				))}

				<div className="font-mono text-[10.5px] tracking-[.12em] text-faint px-3 pb-2 pt-4.5">
					管理
				</div>
				{ADMIN_NAV.map((item) => (
					<Link key={item.to} to={item.to} className="block">
						{({ isActive }) => (
							<NavItem active={isActive}>{item.label}</NavItem>
						)}
					</Link>
				))}

				<div className="mt-auto border-t border-hairline pt-3.5 pb-1 flex items-center gap-2.5 px-2">
					<div className="w-8.5 h-8.5 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm shrink-0">
						管
					</div>
					<div className="min-w-0 flex-1">
						<div className="text-[13px] font-semibold truncate">管理 太郎</div>
						<div className="text-[11px] text-faint">管理者</div>
					</div>
				</div>
			</aside>

			{/* Main column */}
			<div className="flex-1 min-w-0 flex flex-col">
				{/* Header */}
				<header className="h-15.5 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6 gap-4">
					<div className="flex items-center gap-2.25 border border-border rounded-[10px] px-3 py-1.75 bg-surface">
						<div className="w-2 h-2 rounded-[2px] bg-primary" />
						<span className="text-[13.5px] font-bold">A工場</span>
						<button
							type="button"
							className="text-[11.5px] font-bold text-primary bg-primary-soft px-2.25 py-1 rounded-[7px] cursor-pointer border-none"
						>
							切り替え
						</button>
					</div>
					<div className="flex items-center gap-3.5">
						<span className="text-[13px] text-muted font-medium">
							2026/6/30（月）
						</span>
						<span className="text-[11.5px] font-bold text-ink bg-hairline px-2.75 py-1.25 rounded-pill leading-none">
							管理者
						</span>
						<div className="relative" ref={userMenuRef}>
							<button
								type="button"
								onClick={() => setUserMenuOpen((v) => !v)}
								className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm cursor-pointer border-none"
							>
								管
							</button>
							{userMenuOpen && (
								<div className="absolute top-11.5 right-0 w-62 bg-surface border border-border rounded-[13px] shadow-float z-40 overflow-hidden">
									<div className="px-4 py-3.75 border-b border-hairline">
										<div className="text-sm font-bold">管理 太郎</div>
										<div className="text-xs text-faint mt-0.5">
											admin@haiz.co.jp
										</div>
										<div className="text-[11.5px] text-muted mt-1.5">
											株式会社haiz
										</div>
									</div>
									<div className="p-1.5">
										{(
											[
												{ label: "アカウント設定", danger: false },
												{ label: "事業所情報", danger: false },
												{ label: "ログアウト", danger: true },
											] as const
										).map(({ label, danger }) => (
											<button
												key={label}
												type="button"
												className={`w-full text-left px-2.75 py-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer border-none bg-transparent ${
													danger
														? "text-danger hover:bg-danger-soft"
														: "text-ink hover:bg-hairline"
												}`}
											>
												{label}
											</button>
										))}
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
