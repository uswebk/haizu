import type { ShiftMode } from "@haiz/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import {
	fetchWorkPattern,
	saveWorkPattern,
	workPatternKeys,
} from "#/lib/api/workPatterns";

type DraftShift = {
	key: string;
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

	// 取得データから下書きを初期化する
	useEffect(() => {
		if (!workPattern) return;
		setMode(workPattern.mode);
		setShifts(
			workPattern.shifts.map((s) => ({
				key: s.id,
				name: s.name,
				startTime: s.startTime,
				endTime: s.endTime,
			})),
		);
	}, [workPattern]);

	const saveMutation = useMutation({
		mutationFn: () =>
			saveWorkPattern({
				mode,
				shifts:
					mode === "single"
						? []
						: shifts.map((s) => ({
								name: s.name.trim() || "新規シフト",
								startTime: s.startTime,
								endTime: s.endTime,
							})),
			}),
		onSuccess: () => {
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
		setShifts((prev) =>
			prev.length > 1 ? prev.filter((s) => s.key !== key) : prev,
		);

	// 開始・終了が完全に同じシフトは重複登録できない
	const hasDuplicate = useMemo(() => {
		if (mode !== "multi") return false;
		const seen = new Set<string>();
		for (const s of shifts) {
			const key = `${s.startTime}-${s.endTime}`;
			if (seen.has(key)) return true;
			seen.add(key);
		}
		return false;
	}, [mode, shifts]);

	const cardClass = (active: boolean) =>
		`text-left p-4 rounded-md border cursor-pointer transition-colors duration-150 ${
			active
				? "border-primary bg-primary-soft"
				: "border-border bg-surface hover:bg-app-bg"
		}`;

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
					<button
						type="button"
						onClick={() => setMode("single")}
						className={cardClass(mode === "single")}
					>
						<div className="text-sm font-bold">シフトなし</div>
						<div className="text-xs text-muted mt-1.25 leading-relaxed">
							1日1シフト。時間帯の区分はありません。
						</div>
					</button>
					<button
						type="button"
						onClick={selectMulti}
						className={cardClass(mode === "multi")}
					>
						<div className="text-sm font-bold">シフトあり</div>
						<div className="text-xs text-muted mt-1.25 leading-relaxed">
							日勤・遅番・夜勤など、名前と時間で区分します。
						</div>
					</button>
				</div>

				{mode === "multi" ? (
					<div className="bg-surface border border-border rounded-lg p-5.5 mt-5 shadow-card">
						<div className="flex items-center justify-between mb-3.5">
							<div className="text-[13.5px] font-bold">シフト区分</div>
							<Button size="sm" onClick={addShift}>
								＋ シフトを追加
							</Button>
						</div>
						<div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2.5 px-1 pb-2 text-[11px] font-bold text-faint tracking-wide">
							<div>シフト名</div>
							<div>開始</div>
							<div>終了</div>
							<div />
						</div>
						<div className="flex flex-col gap-2.25">
							{shifts.map((sh) => (
								<div
									key={sh.key}
									className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2.5 items-center"
								>
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
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="border-[1.4px] border-dashed border-dash rounded-lg p-7.5 text-center bg-empty-bg text-[13px] text-faint mt-5">
						シフトなし（1日1シフト）で運用します。配置決め・ビュアーでは区分なしで扱います。
					</div>
				)}

				<div className="flex items-center justify-end gap-3.5 mt-5">
					{hasDuplicate && (
						<span className="text-xs font-semibold text-danger">
							開始・終了が同じシフトがあります
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
						onClick={() => saveMutation.mutate()}
						disabled={saveMutation.isPending || hasDuplicate}
					>
						{saveMutation.isPending ? "保存中…" : "保存する"}
					</Button>
				</div>
			</div>
		</div>
	);
}
