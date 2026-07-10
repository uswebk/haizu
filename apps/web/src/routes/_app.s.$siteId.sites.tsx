import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { type SiteView, useSite } from "#/contexts/site-context";
import {
	SiteEditDialog,
	type SiteEditState,
} from "#/features/sites/SiteEditDialog";
import { SiteIcon } from "#/features/sites/SiteIcon";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/sites")({
	beforeLoad: ({ context }) => {
		assertScreen(context.user.role, context.siteRole, "sites");
	},
	component: SitesPage,
});

function SitesPage() {
	const { sites, activeSites, canAddSite, addSite, updateSite } = useSite();
	const [editing, setEditing] = useState<SiteEditState | null>(null);

	const openAdd = () => {
		if (!canAddSite) return;
		setEditing({ mode: "new" });
	};

	const openEdit = (site: SiteView) => {
		setEditing({
			mode: "edit",
			id: site.id,
			name: site.name,
			description: site.description,
			isActive: site.isActive,
		});
	};

	const submit = (input: {
		name: string;
		description: string;
		isActive: boolean;
	}) => {
		if (!editing) return;
		if (editing.mode === "new") addSite(input);
		else updateSite(editing.id, input);
		setEditing(null);
	};

	const canDeactivate =
		editing?.mode === "edit"
			? !(editing.isActive && activeSites.length <= 1)
			: true;

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-205">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="text-[22px] font-bold">拠点管理</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							拠点の名前変更・非アクティブ化ができます。非アクティブの拠点は拠点選択画面に表示されません。
						</div>
					</div>
					<Button onClick={openAdd} disabled={!canAddSite}>
						＋ 拠点を追加
					</Button>
				</div>

				<div className="bg-surface border border-border rounded-section overflow-hidden mt-4.5">
					{sites.map((site, i) => (
						<div
							key={site.id}
							className={`flex items-center gap-3.5 px-4 py-3.5 ${
								i > 0 ? "border-t border-hairline" : ""
							} ${site.isActive ? "" : "opacity-60"}`}
						>
							<SiteIcon icon={site.icon} size="md" />
							<div className="min-w-0">
								<div className="text-[15px] font-bold text-ink truncate">
									{site.name}
								</div>
								<div className="text-xs text-faint mt-0.5 truncate">
									{site.description} ・ 従業員 {site.employeeCount}名
								</div>
							</div>
							<div className="flex-1" />
							{site.isActive ? (
								<Badge tone="success">アクティブ</Badge>
							) : (
								<Badge tone="draft">非アクティブ</Badge>
							)}
							<Button
								variant="secondary"
								size="sm"
								onClick={() => openEdit(site)}
							>
								編集
							</Button>
						</div>
					))}
				</div>
			</div>

			{editing && (
				<SiteEditDialog
					state={editing}
					canDeactivate={canDeactivate}
					onCancel={() => setEditing(null)}
					onSubmit={submit}
				/>
			)}
		</div>
	);
}
