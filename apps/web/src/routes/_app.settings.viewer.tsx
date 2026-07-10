import type { ViewerConfig, ViewerMode } from "@haizu/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { OptionCard } from "#/components/ui/OptionCard";
import { useSnackbar } from "#/contexts/snackbar-context";
import { areaKeys, fetchAreas } from "#/lib/api/areas";
import { fetchShiftsUsed } from "#/lib/api/assignments";
import {
	fetchViewerConfigs,
	saveViewerConfig,
	viewerConfigKeys,
} from "#/lib/api/viewer";
import { todayStr } from "#/lib/datetime";

export const Route = createFileRoute("/_app/settings/viewer")({
	component: ViewerSettings,
});

type LeadDir = "before" | "after";

type Draft = {
	mode: ViewerMode;
	displayDate: string;
	shiftId: string | null;
	leadMinutes: string; // 大きさ（0–240）。入力中は文字列で保持し、保存時に数値化する
	leadDir: LeadDir; // before=分前 / after=分後
};

function defaultConfig(areaId: string): ViewerConfig {
	return {
		areaId,
		mode: "auto",
		displayDate: null,
		shiftId: null,
		shiftName: null,
		shiftStartTime: null,
		shiftEndTime: null,
		leadMinutes: 0,
	};
}

function ViewerSettings() {
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);

	const { data: areas = [] } = useQuery({
		queryKey: areaKeys.all,
		queryFn: () => fetchAreas(),
	});
	const { data: configs = [] } = useQuery({
		queryKey: viewerConfigKeys.all,
		queryFn: fetchViewerConfigs,
	});

	const configByArea = new Map(configs.map((c) => [c.areaId, c]));

	// 選択中エリア・表示日で確定実績のあるシフトのみを選択肢にする（終日は常に選べる）
	const displayDate = draft?.mode === "manual" ? draft.displayDate : undefined;
	const { data: shiftChips = [] } = useQuery({
		queryKey: ["assignments", "shifts-used", selectedAreaId, displayDate],
		queryFn: () => fetchShiftsUsed(selectedAreaId as string, displayDate),
		enabled: !!selectedAreaId && !!displayDate,
	});

	const shiftLabel = (shiftId: string | null) =>
		shiftId
			? (shiftChips.find((s) => s.id === shiftId)?.name ?? "不明なシフト")
			: "終日";

	const saveMutation = useMutation({
		mutationFn: () => {
			if (!selectedAreaId || !draft) throw new Error("no draft");
			const mag = clampLead(draft.leadMinutes);
			const signed = draft.leadDir === "before" ? mag : -mag;
			return saveViewerConfig(selectedAreaId, {
				mode: draft.mode,
				displayDate: draft.mode === "manual" ? draft.displayDate : null,
				shiftId: draft.mode === "manual" ? draft.shiftId : null,
				leadMinutes: draft.mode === "auto" ? signed : 0,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: viewerConfigKeys.all });
			showSuccess("ビュアー設定を保存しました");
		},
	});

	const openArea = (areaId: string) => {
		saveMutation.reset();
		const cfg = configByArea.get(areaId) ?? defaultConfig(areaId);
		setDraft({
			mode: cfg.mode,
			displayDate: cfg.displayDate ?? todayStr(),
			shiftId: cfg.shiftId,
			leadMinutes: String(Math.abs(cfg.leadMinutes)),
			leadDir: cfg.leadMinutes < 0 ? "after" : "before",
		});
		setSelectedAreaId(areaId);
	};

	const closeArea = () => {
		setSelectedAreaId(null);
		setDraft(null);
	};

	const selectedArea = areas.find((a) => a.id === selectedAreaId);

	if (selectedAreaId && draft && selectedArea) {
		return (
			<div className="p-7 overflow-auto h-full">
				<div className="max-w-180">
					<button
						type="button"
						onClick={closeArea}
						className="text-xs font-semibold text-muted hover:text-ink bg-transparent border-none cursor-pointer px-0"
					>
						← エリア一覧
					</button>
					<div className="text-[20px] font-bold mt-3.5">
						{selectedArea.name} の表示設定
					</div>
					<div className="text-[13px] text-muted mt-1">
						このエリアのビュアー表示方法を選びます。
					</div>

					<div className="grid grid-cols-2 gap-3.5 mt-5">
						<OptionCard
							title="強制表示"
							description="指定した日付・シフトを常に表示します。"
							selected={draft.mode === "manual"}
							onClick={() => setDraft({ ...draft, mode: "manual" })}
						/>
						<OptionCard
							title="働き方に合わせて自動表示"
							description="現在時刻に応じて今日のシフトを自動表示します。"
							selected={draft.mode === "auto"}
							onClick={() => setDraft({ ...draft, mode: "auto" })}
						/>
					</div>

					{draft.mode === "manual" ? (
						<div className="bg-surface border border-border rounded-lg p-5.5 mt-5 shadow-card">
							<div className="text-[13.5px] font-bold mb-4">強制表示の内容</div>
							<div className="grid grid-cols-[1fr_1.4fr] gap-5 items-start">
								<div>
									<div className="block text-xs font-semibold text-muted mb-2">
										表示する日付
									</div>
									<input
										type="date"
										value={draft.displayDate}
										onChange={(e) =>
											setDraft({ ...draft, displayDate: e.target.value })
										}
										className="w-full font-sans text-[13.5px] font-bold text-ink border border-border rounded-md px-3 py-2.5 bg-surface outline-none"
									/>
								</div>
								<div>
									<div className="block text-xs font-semibold text-muted mb-2">
										シフト
									</div>
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() => setDraft({ ...draft, shiftId: null })}
											className={`px-3.25 py-2 rounded-pill border cursor-pointer text-[12.5px] ${
												draft.shiftId === null
													? "font-bold border-primary text-primary bg-primary-soft"
													: "font-semibold border-border text-muted bg-surface"
											}`}
										>
											終日
										</button>
										{shiftChips.map((s) => {
											const on = draft.shiftId === s.id;
											return (
												<button
													key={s.id}
													type="button"
													onClick={() => setDraft({ ...draft, shiftId: s.id })}
													title={s.deleted ? "過去のシフト" : undefined}
													className={`flex flex-col items-start px-3.25 py-1.75 rounded-md border cursor-pointer ${
														on
															? "font-bold border-primary text-primary bg-primary-soft"
															: s.deleted
																? "font-semibold border-dashed border-border text-faint bg-surface"
																: "font-semibold border-border text-muted bg-surface"
													}`}
												>
													<span className="text-[12.5px] flex items-center gap-1.25">
														{s.name}
														{s.deleted && (
															<span className="text-[10px] font-bold text-faint bg-table-head px-1.5 py-0.5 rounded-[6px]">
																過去
															</span>
														)}
													</span>
													<span className="text-[10.5px] tabular-nums opacity-80">
														{s.startTime}–{s.endTime}
													</span>
												</button>
											);
										})}
									</div>
									{shiftChips.length === 0 && (
										<div className="text-[11px] text-faint mt-1.5">
											この日に確定済みの配置がまだありません
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="bg-surface border border-border rounded-lg p-5.5 mt-5 shadow-card">
							<div className="text-[13.5px] font-bold mb-1">
								自動表示のカスタマイズ
							</div>
							<div className="text-xs text-faint mb-4">
								働き方（シフト）設定の時間帯に基づいて切り替わります。
							</div>
							<div className="block text-xs font-semibold text-muted mb-2">
								シフト開始の何分前／何分後から表示するか
							</div>
							<div className="flex items-center gap-2.5">
								<input
									type="number"
									min={0}
									max={240}
									value={draft.leadMinutes}
									onChange={(e) =>
										setDraft({ ...draft, leadMinutes: e.target.value })
									}
									onBlur={() =>
										setDraft({
											...draft,
											leadMinutes: String(clampLead(draft.leadMinutes)),
										})
									}
									className="w-27.5 font-sans text-sm font-bold text-ink border border-border rounded-md px-3 py-2.5 bg-surface outline-none"
								/>
								<span className="text-[13.5px] font-semibold text-muted">
									分
								</span>
								<div className="flex items-center gap-1 border border-border rounded-md p-0.75 bg-app-bg">
									{(["before", "after"] as const).map((dir) => (
										<button
											key={dir}
											type="button"
											onClick={() => setDraft({ ...draft, leadDir: dir })}
											className={`text-[12.5px] px-3.25 py-1.5 rounded-sm cursor-pointer ${
												draft.leadDir === dir
													? "font-bold text-primary bg-primary-soft"
													: "font-semibold text-muted"
											}`}
										>
											{dir === "before" ? "前" : "後"}
										</button>
									))}
								</div>
								<span className="text-[13.5px] font-semibold text-muted">
									から表示
								</span>
							</div>
							<div className="text-[11.5px] text-faint mt-2.5">
								例：30分前 →
								シフト開始30分前に次のシフトの配置へ切り替え。30分後 →
								シフト開始30分後に切り替わります。
							</div>
						</div>
					)}

					<div className="flex items-center justify-end gap-2.5 mt-5">
						{saveMutation.isSuccess && !saveMutation.isPending && (
							<span className="text-[12.5px] font-bold text-success mr-auto">
								保存しました
							</span>
						)}
						<Button
							variant="secondary"
							onClick={closeArea}
							disabled={saveMutation.isPending}
						>
							一覧へ戻る
						</Button>
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending}
						>
							{saveMutation.isPending ? "保存中…" : "保存する"}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-180">
				<Link
					to="/settings"
					className="text-xs font-semibold text-muted hover:text-ink"
				>
					← 設定
				</Link>
				<div className="text-[20px] font-bold mt-3.5">配置ビュアー設定</div>
				<div className="text-[13px] text-muted mt-1 mb-5">
					エリアごとに、大画面ビュアーの表示方法を設定します。
				</div>

				<div className="flex flex-col gap-3">
					{areas.map((area) => {
						const cfg = configByArea.get(area.id) ?? defaultConfig(area.id);
						const isManual = cfg.mode === "manual";
						const manualShift = cfg.shiftId
							? (cfg.shiftName ?? shiftLabel(cfg.shiftId))
							: "終日";
						const detail = isManual
							? `${cfg.displayDate ?? "-"} ・ ${manualShift}`
							: `${Math.abs(cfg.leadMinutes)}分${cfg.leadMinutes < 0 ? "後" : "前"}から自動表示`;
						return (
							<button
								key={area.id}
								type="button"
								onClick={() => openArea(area.id)}
								className="w-full text-left flex items-center justify-between gap-4 bg-surface border border-border rounded-lg px-5 py-4.25 shadow-card cursor-pointer hover:bg-app-bg transition-colors duration-150"
							>
								<div className="min-w-0">
									<div className="text-[15px] font-bold">{area.name}</div>
									<div className="text-[12.5px] text-faint mt-0.75">
										{detail}
									</div>
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<span
										className={`text-xs font-bold px-2.75 py-1.25 rounded-pill ${
											isManual
												? "text-warning bg-warning-soft"
												: "text-primary-hover bg-primary-soft"
										}`}
									>
										{isManual ? "強制表示" : "自動表示"}
									</span>
									<span className="text-lg text-faint">›</span>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function clampLead(value: string): number {
	const n = Number.parseInt(value, 10);
	if (Number.isNaN(n)) return 0;
	return Math.min(240, Math.max(0, n));
}
