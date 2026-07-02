import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { useDismiss } from "#/hooks/useDismiss";
import {
	type AreaListItem,
	areaKeys,
	createArea,
	deleteArea,
	fetchAreas,
} from "#/lib/api/areas";

export const Route = createFileRoute("/_app/editor/")({
	component: EditorList,
});

function EditorList() {
	const queryClient = useQueryClient();
	const [addOpen, setAddOpen] = useState(false);
	const [newAreaName, setNewAreaName] = useState("");
	const addDialogRef = useRef<HTMLDivElement>(null);
	useDismiss(addOpen, () => setAddOpen(false), addDialogRef);

	const [deleteTarget, setDeleteTarget] = useState<AreaListItem | null>(null);

	const { data: areas = [] } = useQuery({
		queryKey: areaKeys.all,
		queryFn: fetchAreas,
	});

	const addMutation = useMutation({
		mutationFn: createArea,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.all });
			setAddOpen(false);
			setNewAreaName("");
		},
	});

	const handleAddArea = () => {
		if (!newAreaName.trim()) return;
		addMutation.mutate(newAreaName.trim());
	};

	const deleteMutation = useMutation({
		mutationFn: deleteArea,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.all });
			setDeleteTarget(null);
		},
	});

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-245">
				<div className="flex items-end justify-between gap-5 mb-5.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">配置エリア一覧</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							エリアを選んで、図面と配置スポットを設定します。
						</div>
					</div>
					<Button onClick={() => setAddOpen(true)}>＋ エリアを追加</Button>
				</div>

				<div
					className="grid gap-4"
					style={{
						gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
					}}
				>
					{areas.map((area) => (
						<div key={area.id} className="relative group">
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setDeleteTarget(area);
								}}
								aria-label="エリアを削除"
								className="absolute top-3 right-3 z-10 w-6.5 h-6.5 rounded-sm bg-surface border border-border text-faint flex items-center justify-center text-sm cursor-pointer opacity-0 group-hover:opacity-100 hover:text-danger hover:border-danger"
							>
								×
							</button>
							<Link
								to="/editor/$areaId"
								params={{ areaId: area.id }}
								className="block text-ink"
							>
								<div className="bg-surface border border-border rounded-lg p-4.5 shadow-card cursor-pointer transition-[box-shadow,transform] duration-150 hover:shadow-[0_1px_2px_rgba(16,42,67,.06),0_10px_26px_rgba(16,42,67,.09)] hover:-translate-y-px">
									<div className="flex items-center justify-between gap-2.5">
										<div className="text-base font-bold min-w-0 truncate pr-6">
											{area.name}
										</div>
										{area.floorPlanName ? (
											<Badge tone="success">図面あり</Badge>
										) : (
											<Badge tone="warning">図面なし</Badge>
										)}
									</div>
									<div className="text-[12.5px] text-faint mt-1.25 truncate">
										{area.floorPlanName ?? "—"}
									</div>
									<div className="h-px bg-hairline my-3.5" />
									<div className="flex items-center justify-between">
										<div className="text-[13px] text-muted">
											スポット{" "}
											<b className="text-ink font-bold">{area.spotCount}</b>{" "}
											箇所
										</div>
										<div className="flex items-center gap-1.5">
											{area.currentVersion && (
												<span className="text-[11.5px] font-bold text-faint">
													{area.currentVersion}
												</span>
											)}
											{area.currentStatus === "published" ? (
												<Badge tone="success">公開中</Badge>
											) : area.currentStatus === "draft" ? (
												<Badge tone="draft">下書き</Badge>
											) : null}
										</div>
									</div>
								</div>
							</Link>
						</div>
					))}
				</div>
			</div>

			{addOpen && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div
						ref={addDialogRef}
						className="w-115 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]"
					>
						<div className="flex items-center justify-between px-5.5 py-4.5 border-b border-hairline">
							<div className="text-base font-bold">エリアを追加</div>
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
								エリア名
							</label>
							<input
								id="new-area-name"
								value={newAreaName}
								onChange={(e) => setNewAreaName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
								placeholder="荷捌き場"
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
									キャンセル
								</Button>
								<Button
									onClick={handleAddArea}
									disabled={addMutation.isPending}
								>
									{addMutation.isPending ? "追加中…" : "追加する"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{deleteTarget && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">エリアを削除</div>
						<div className="text-[13.5px] text-muted">
							「{deleteTarget.name}
							」を削除します。図面・配置スポットもすべて削除され、元に戻せません。
						</div>
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setDeleteTarget(null)}
								disabled={deleteMutation.isPending}
							>
								キャンセル
							</Button>
							<Button
								onClick={() => deleteMutation.mutate(deleteTarget.id)}
								disabled={deleteMutation.isPending}
							>
								{deleteMutation.isPending ? "削除中…" : "削除する"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
