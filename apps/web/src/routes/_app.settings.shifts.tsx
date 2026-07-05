import type { ShiftMode } from "@haiz/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { OptionCard } from "#/components/ui/OptionCard";
import {
	fetchWorkPattern,
	saveWorkPattern,
	workPatternKeys,
} from "#/lib/api/workPatterns";

type DraftShift = {
	key: string;
	id?: string; // サーバ既存シフトのID（新規追加分は undefined）
	name: string;
	startTime: string;
	endTime: string;
};

export const Route = createFileRoute("/_app/settings/shifts")({
	component: ShiftSettings,
});

function newShift(): DraftShift {
	return {
		key: crypto.randomUUID(),
		name: "新規シフト",
		startTime: "09:00",
		endTime: "18:00",
	};
}

function ShiftSettings() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: workPattern } = useQuery({
		queryKey: workPatternKeys.detail,
		queryFn: fetchWorkPattern,
	});

	const [mode, setMode] = useState<ShiftMode>("single");
	const [shifts, setShifts] = useState<DraftShift[]>([]);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deletedNotice, setDeletedNotice] = useState(false);
	// 取得＆下書き初期化が完了するまでモード選択を出さない（初期 single のちらつき防止）
	const [ready, setReady] = useState(false);

	// 取得データから下書きを初期化する
	useEffect(() => {
		if (!workPattern) return;
		setMode(workPattern.mode);
		setDeletedNotice(false);
		setShifts(
			workPattern.shifts.map((s) => ({
				key: s.id,
				id: s.id,
				name: s.name,
				startTime: s.startTime,
				endTime: s.endTime,
			})),
		);
		setReady(true);
	}, [workPattern]);

	const saveMutation = useMutation({
		mutationFn: () =>
			saveWorkPattern({
				mode,
				shifts:
					mode === "single"
						? []
						: shifts.map((s) => ({
								id: s.id,
								name: s.name.trim() || "新規シフト",
								startTime: s.startTime,
								endTime: s.endTime,
							})),
			}),
		onSuccess: () => {
			setConfirmOpen(false);
			void queryClient.invalidateQueries({ queryKey: workPatternKeys.detail });
		},
	});

	const selectMulti = () => {
		setMode("multi");
		setShifts((prev) => (prev.length === 0 ? [newShift()] : prev));
	};

	const addShift = () => setShifts((prev) => [...prev, newShift()]);

	const updateShift = (
		key: string,
		field: "name" | "startTime" | "endTime",
		value: string,
	) =>
		setShifts((prev) =>
			prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)),
		);

	const removeShift = (key: string) =>
		setShifts((prev) => {
			if (prev.length <= 1) return prev;
			setDeletedNotice(true);
			return prev.filter((s) => s.key !== key);
		});

	const dragKey = useRef<string | null>(null);
	const [dragOverKey, setDragOverKey] = useState<string | null>(null);

	const reorderShift = (draggedKey: string, targetKey: string) =>
		setShifts((prev) => {
			if (draggedKey === targetKey) return prev;
			const from = prev.findIndex((s) => s.key === draggedKey);
			const to = prev.findIndex((s) => s.key === targetKey);
			if (from < 0 || to < 0) return prev;
			const next = [...prev];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});

	// 開始・終了が完全に同じシフト、または同名シフトは重複登録できない
	const duplicateError = useMemo(() => {
		if (mode !== "multi") return null;
		const times = new Set<string>();
		const names = new Set<string>();
		for (const s of shifts) {
			const timeKey = `${s.startTime}-${s.endTime}`;
			if (times.has(timeKey)) return "開始・終了が同じシフトがあります";
			times.add(timeKey);
			const name = s.name.trim();
			if (name && names.has(name)) return "シフト名が重複しています";
			names.add(name);
		}
		return null;
	}, [mode, shifts]);
	const hasDuplicate = duplicateError !== null;

	if (!ready) {
		return (
			<div className="p-7 overflow-auto h-full">
				<div className="max-w-190">
					<Link
						to="/settings"
						className="text-xs font-semibold text-muted hover:text-ink"
					>
						← 設定
					</Link>
					<div className="text-[22px] font-bold mt-2">働き方（シフト）設定</div>
					<div className="text-[13.5px] text-muted mt-4.5">読み込み中…</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-190">
				<Link
					to="/settings"
					className="text-xs font-semibold text-muted hover:text-ink"
				>
					← 設定
				</Link>
				<div className="text-[22px] font-bold mt-2">働き方（シフト）設定</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					この拠点のシフト区分を決めます。
				</div>

				<div className="grid grid-cols-2 gap-3.5 mt-4.5">
					<OptionCard
						title="シフトなし"
						description="1日1シフト。時間帯の区分はありません。"
						selected={mode === "single"}
						onClick={() => setMode("single")}
					/>
					<OptionCard
						title="シフトあり"
						description="日勤・遅番・夜勤など、名前と時間で区分します。"
						selected={mode === "multi"}
						onClick={selectMulti}
					/>
				</div>

				{mode === "multi" ? (
					<div className="bg-surface border border-border rounded-lg p-5.5 mt-5 shadow-card">
						<div className="flex items-center justify-between mb-3.5">
							<div className="text-[13.5px] font-bold">シフト区分</div>
							<Button size="sm" onClick={addShift}>
								＋ シフトを追加
							</Button>
						</div>
						{deletedNotice && (
							<div className="flex items-start gap-2 text-[12px] font-semibold text-warning bg-warning-soft rounded-md px-3 py-2 mb-3 leading-relaxed">
								<span aria-hidden>⚠</span>
								<span>
									削除したシフトで作成中の配置決めの下書きは、保存すると破棄されます。
								</span>
							</div>
						)}
						<div className="grid grid-cols-[auto_1.6fr_1fr_1fr_auto] gap-2.5 px-1 pb-2 text-[11px] font-bold text-faint tracking-wide">
							<div />
							<div>シフト名</div>
							<div>開始</div>
							<div>終了</div>
							<div />
						</div>
						<div className="flex flex-col gap-2.25">
							{shifts.map((sh) => (
								<fieldset
									key={sh.key}
									aria-label={`シフト ${sh.name || "新規シフト"}`}
									draggable={false}
									onDragOver={(e) => {
										e.preventDefault();
										if (dragOverKey !== sh.key) setDragOverKey(sh.key);
									}}
									onDragLeave={() =>
										setDragOverKey((k) => (k === sh.key ? null : k))
									}
									onDrop={(e) => {
										e.preventDefault();
										if (dragKey.current) reorderShift(dragKey.current, sh.key);
										dragKey.current = null;
										setDragOverKey(null);
									}}
									className={`grid grid-cols-[auto_1.6fr_1fr_1fr_auto] gap-2.5 items-center rounded-sm border-none p-0 m-0 ${
										dragOverKey === sh.key ? "bg-primary-soft/40" : ""
									}`}
								>
									<button
										type="button"
										draggable
										onDragStart={() => {
											dragKey.current = sh.key;
										}}
										onDragEnd={() => {
											dragKey.current = null;
											setDragOverKey(null);
										}}
										title="ドラッグで並び替え"
										className="w-8.5 h-8.5 flex items-center justify-center rounded-sm bg-app-bg text-faint text-base cursor-grab active:cursor-grabbing hover:bg-hairline"
									>
										⠿
									</button>
									<Input
										value={sh.name}
										onChange={(e) =>
											updateShift(sh.key, "name", e.target.value)
										}
									/>
									<Input
										type="time"
										value={sh.startTime}
										onChange={(e) =>
											updateShift(sh.key, "startTime", e.target.value)
										}
									/>
									<Input
										type="time"
										value={sh.endTime}
										onChange={(e) =>
											updateShift(sh.key, "endTime", e.target.value)
										}
									/>
									<button
										type="button"
										onClick={() => removeShift(sh.key)}
										title="削除"
										disabled={shifts.length <= 1}
										className="w-8.5 h-8.5 flex items-center justify-center rounded-sm bg-app-bg text-faint text-base cursor-pointer hover:bg-hairline disabled:opacity-40 disabled:cursor-not-allowed"
									>
										×
									</button>
								</fieldset>
							))}
						</div>
					</div>
				) : (
					<div className="border-[1.4px] border-dashed border-dash rounded-lg p-7.5 text-center bg-empty-bg text-[13px] text-faint mt-5">
						シフトなし（1日1シフト）で運用します。配置決め・ビュアーでは区分なしで扱います。
					</div>
				)}

				<div className="flex items-center justify-end gap-3.5 mt-5">
					{duplicateError && (
						<span className="text-xs font-semibold text-danger">
							{duplicateError}
						</span>
					)}
					<Button
						variant="secondary"
						onClick={() => navigate({ to: "/settings" })}
						disabled={saveMutation.isPending}
					>
						キャンセル
					</Button>
					<Button
						onClick={() => setConfirmOpen(true)}
						disabled={saveMutation.isPending || hasDuplicate}
					>
						保存する
					</Button>
				</div>
			</div>

			{confirmOpen && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-115 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">シフト設定を保存</div>
						<div className="text-[13.5px] text-muted leading-relaxed">
							変更・削除したシフトで作成中の配置決めの下書きは破棄されます。保存してよろしいですか？
						</div>
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setConfirmOpen(false)}
								disabled={saveMutation.isPending}
							>
								キャンセル
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
			)}
		</div>
	);
}
