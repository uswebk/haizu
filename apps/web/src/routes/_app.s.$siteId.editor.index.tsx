import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddCard } from "#/components/ui/AddCard";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { useSnackbar } from "#/contexts/snackbar-context";
import { useDismiss } from "#/hooks/useDismiss";
import { areaKeys, createArea, fetchAreas } from "#/lib/api/areas";

export const Route = createFileRoute("/_app/s/$siteId/editor/")({
	component: EditorList,
});

function EditorList() {
	const { siteId } = Route.useParams();
	const { t } = useTranslation(["editor", "common"]);
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const [addOpen, setAddOpen] = useState(false);
	const [newAreaName, setNewAreaName] = useState("");
	const addDialogRef = useRef<HTMLDivElement>(null);
	useDismiss(addOpen, () => setAddOpen(false), addDialogRef);

	const { data: areas = [] } = useQuery({
		queryKey: areaKeys.all,
		queryFn: () => fetchAreas(),
	});

	const addMutation = useMutation({
		mutationFn: createArea,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.all });
			setAddOpen(false);
			setNewAreaName("");
			showSuccess(t("editor:areaAdded"));
		},
	});

	const handleAddArea = () => {
		if (!newAreaName.trim()) return;
		addMutation.mutate(newAreaName.trim());
	};

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-245">
				<div className="flex items-end justify-between gap-5 mb-5.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">{t("editor:listTitle")}</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							{t("editor:listSubtitle")}
						</div>
					</div>
					<Button onClick={() => setAddOpen(true)}>
						{t("editor:addArea")}
					</Button>
				</div>

				<div
					className="grid gap-4"
					style={{
						gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
					}}
				>
					{areas.map((area) => (
						<Link
							key={area.id}
							to="/s/$siteId/editor/$areaId"
							params={{ siteId, areaId: area.id }}
							className="block text-ink"
						>
							<div className="min-h-40 flex flex-col justify-between bg-surface border border-border rounded-lg p-6 shadow-card cursor-pointer transition-[box-shadow,transform] duration-150 hover:shadow-[0_1px_2px_rgba(16,42,67,.06),0_10px_26px_rgba(16,42,67,.09)] hover:-translate-y-px">
								<div className="flex items-center justify-between gap-2.5">
									<div className="text-base font-bold min-w-0 truncate">
										{area.name}
									</div>
									{area.floorPlanName ? (
										<Badge tone="success">{t("editor:hasPlan")}</Badge>
									) : (
										<Badge tone="warning">{t("editor:noPlan")}</Badge>
									)}
								</div>
								<div>
									<div className="h-px bg-hairline mt-3.5" />
									<div className="flex items-center justify-between mt-3.5">
										<div className="text-[13px] text-muted">
											{t("editor:spotCountPrefix")}{" "}
											<b className="text-ink font-bold">{area.spotCount}</b>{" "}
											{t("editor:spotCountSuffix")}
										</div>
										<div className="flex items-center gap-1.5">
											{area.currentVersion && (
												<span className="text-[11.5px] font-bold text-faint">
													{area.currentVersion}
												</span>
											)}
											{area.currentStatus === "published" ? (
												<Badge tone="success">{t("editor:published")}</Badge>
											) : area.currentStatus === "draft" ? (
												<Badge tone="draft">{t("editor:draft")}</Badge>
											) : null}
										</div>
									</div>
								</div>
							</div>
						</Link>
					))}
					<AddCard
						label={t("editor:addArea2")}
						onClick={() => setAddOpen(true)}
					/>
				</div>
			</div>

			{addOpen && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div
						ref={addDialogRef}
						className="w-115 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]"
					>
						<div className="flex items-center justify-between px-5.5 py-4.5 border-b border-hairline">
							<div className="text-base font-bold">{t("editor:addArea2")}</div>
							<button
								type="button"
								onClick={() => setAddOpen(false)}
								className="w-7 h-7 rounded-sm bg-app-bg text-faint flex items-center justify-center text-base cursor-pointer border-none"
							>
								×
							</button>
						</div>
						<div className="p-5.5">
							<label
								htmlFor="new-area-name"
								className="block text-xs font-semibold text-muted mb-1.5"
							>
								{t("editor:areaName")}
							</label>
							<input
								id="new-area-name"
								value={newAreaName}
								onChange={(e) => setNewAreaName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
								placeholder={t("editor:areaNamePlaceholder")}
								className="w-full font-sans text-sm px-3 py-2.5 rounded-[9px] border border-border bg-surface text-ink outline-none focus:border-primary"
							/>
							<div className="flex justify-end gap-2.5 mt-6">
								<Button
									variant="secondary"
									onClick={() => {
										setAddOpen(false);
										setNewAreaName("");
									}}
								>
									{t("common:cancel")}
								</Button>
								<Button
									onClick={handleAddArea}
									disabled={addMutation.isPending}
								>
									{addMutation.isPending ? t("editor:adding") : t("editor:add")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
