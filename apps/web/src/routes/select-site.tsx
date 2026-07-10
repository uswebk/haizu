import { displayRole, landingScreen } from "@haizu/shared";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteProvider, useSite } from "#/contexts/site-context";
import { SiteEditDialog } from "#/features/sites/SiteEditDialog";
import { SiteIcon } from "#/features/sites/SiteIcon";
import { ROLE_LABEL } from "#/lib/roles";
import { fetchSession } from "#/lib/session";

export const Route = createFileRoute("/select-site")({
	beforeLoad: async () => {
		const auth = await fetchSession();
		if (!auth) throw redirect({ to: "/login" });
		if (!auth.user.emailVerified) throw redirect({ to: "/verify-otp" });
		return auth;
	},
	component: SelectSitePage,
});

function SelectSitePage() {
	return (
		<SiteProvider>
			<SelectSiteInner />
		</SiteProvider>
	);
}

function SelectSiteInner() {
	const navigate = useNavigate();
	const { activeSites, canAddSite, switchSite, addSite } = useSite();
	const [addOpen, setAddOpen] = useState(false);
	const { user, siteRole } = Route.useRouteContext();
	const userName = user.name;
	// 表示は「現在拠点における実効ロール」。拠点未所属なら「その他」相当。
	const roleLabel = ROLE_LABEL[displayRole(user.role, siteRole) ?? "viewer"];
	const initial = userName.charAt(0) || "?";

	// 遷移先は「選択した拠点における実効ロール」で決まる（拠点ごとに権限が異なるため）
	const select = (id: string) => {
		const target = activeSites.find((s) => s.id === id);
		if (!target) return;
		switchSite(id);
		void navigate({ to: landingScreen(user.role, target.role) });
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-[#f0f5fb] to-app-bg flex flex-col items-center justify-center p-10">
			<div className="flex items-center gap-2.75 pb-4.5">
				<img
					src="/logo.svg"
					alt="haizu"
					className="w-11.5 h-11.5 rounded-[12px]"
				/>
				<div>
					<div className="font-bold text-2xl leading-none text-ink">haizu</div>
					<div className="font-mono text-[9.5px] tracking-[.14em] text-faint mt-1">
						配置管理SYSTEM
					</div>
				</div>
			</div>

			<div className="text-[22px] font-bold">拠点を選択</div>
			<div className="text-[13.5px] text-muted mt-1.5">
				操作する拠点を選んでください。選んだ拠点を基準に従業員・配置を管理します。
			</div>

			<div className="flex flex-wrap justify-center gap-4.5 max-w-190 mt-7">
				{activeSites.map((site) => (
					<button
						key={site.id}
						type="button"
						onClick={() => select(site.id)}
						className="w-57 text-left bg-surface border border-border rounded-section p-5.5 cursor-pointer transition-shadow duration-150 hover:shadow-float"
					>
						<SiteIcon icon={site.icon} size="lg" />
						<div className="text-[17px] font-bold text-ink mt-3.5 truncate">
							{site.name}
						</div>
						<div className="text-[12.5px] text-faint mt-0.5">
							{site.description}
						</div>
						<div className="h-px bg-hairline my-3.5" />
						<div className="flex items-center justify-between">
							<span className="text-[12.5px] text-muted">
								従業員{" "}
								<span className="font-bold text-ink">{site.employeeCount}</span>{" "}
								名
							</span>
							<span className="text-[12.5px] font-bold text-primary">
								選択 →
							</span>
						</div>
					</button>
				))}

				<button
					type="button"
					onClick={() => canAddSite && setAddOpen(true)}
					disabled={!canAddSite}
					className="w-57 flex flex-col items-center justify-center gap-2.5 border-[1.6px] border-dashed border-dash rounded-section p-5.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-transparent"
				>
					<span className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xl">
						＋
					</span>
					<span className="text-[14px] font-bold text-ink">拠点を追加</span>
					<span className="text-[12px] text-faint">管理者のみ</span>
				</button>
			</div>

			<div className="flex items-center gap-2.5 mt-9">
				<div className="w-7.5 h-7.5 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs">
					{initial}
				</div>
				<span className="text-[12.5px] text-faint">
					{userName} ・ {roleLabel}
				</span>
			</div>

			{addOpen && (
				<SiteEditDialog
					state={{ mode: "new" }}
					canDeactivate
					onCancel={() => setAddOpen(false)}
					onSubmit={(input) => {
						addSite(input);
						setAddOpen(false);
					}}
				/>
			)}
		</div>
	);
}
