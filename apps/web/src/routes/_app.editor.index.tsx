import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { areaKeys, createArea, fetchAreas } from "#/lib/api/areas";

export const Route = createFileRoute("/_app/editor/")({
	component: EditorList,
});

function EditorList() {
	const queryClient = useQueryClient();
	const [addOpen, setAddOpen] = useState(false);
	const [newAreaName, setNewAreaName] = useState("");

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

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-[980px]">
				<div className="flex items-end justify-between gap-5 mb-[22px] flex-wrap">
					<div>
						<div className="text-[22px] font-bold">配置エリア一覧</div>
						<div className="text-[13.5px] text-muted mt-[5px]">
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
						<Link
							key={area.id}
							to="/editor/$areaId"
							params={{ areaId: area.id }}
							className="block text-ink"
						>
							<div className="bg-surface border border-border rounded-[14px] p-[18px] shadow-card cursor-pointer transition-[box-shadow,transform] duration-150 hover:shadow-[0_1px_2px_rgba(16,42,67,.06),0_10px_26px_rgba(16,42,67,.09)] hover:-translate-y-px">
								<div className="flex items-center justify-between gap-[10px]">
									<div className="text-[16px] font-bold min-w-0 truncate">
										{area.name}
									</div>
									{area.floorPlanName ? (
										<Badge tone="success">図面あり</Badge>
									) : (
										<Badge tone="warning">図面なし</Badge>
									)}
								</div>
								<div className="text-[12.5px] text-faint mt-[5px] truncate">
									{area.floorPlanName ?? "—"}
								</div>
								<div className="h-px bg-hairline my-[14px]" />
								<div className="flex items-center justify-between">
									<div className="text-[13px] text-muted">
										スポット{" "}
										<b className="text-ink font-bold">{area.spotCount}</b> 箇所
									</div>
									<div className="flex items-center gap-[6px]">
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
					))}
				</div>
			</div>

			{addOpen && (
				<div
					className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60"
					onClick={() => setAddOpen(false)}
				>
					<div
						className="w-[460px] max-w-full bg-surface rounded-[16px] shadow-[0_24px_60px_rgba(16,42,67,.3)]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between px-[22px] py-[18px] border-b border-hairline">
							<div className="text-[16px] font-bold">エリアを追加</div>
							<button
								type="button"
								onClick={() => setAddOpen(false)}
								className="w-7 h-7 rounded-[8px] bg-app-bg text-faint flex items-center justify-center text-[16px] cursor-pointer border-none"
							>
								×
							</button>
						</div>
						<div className="p-[22px]">
							<label className="block text-[12px] font-semibold text-muted mb-[6px]">
								エリア名
							</label>
							<input
								value={newAreaName}
								onChange={(e) => setNewAreaName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
								placeholder="ライン3"
								className="w-full font-sans text-[14px] px-3 py-[10px] rounded-[9px] border border-border bg-surface text-ink outline-none focus:border-primary"
							/>
							<div className="flex justify-end gap-[10px] mt-6">
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
		</div>
	);
}
