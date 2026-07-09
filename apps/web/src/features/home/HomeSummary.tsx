import type { WorkPattern } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getShiftOptions } from "#/features/assignment/shift";
import type { AreaListItem } from "#/lib/api/areas";
import { fetchAssignments } from "#/lib/api/assignments";

export function HomeSummary({
	today,
	areas,
	activeEmployeeCount,
	workPattern,
}: {
	today: string;
	areas: AreaListItem[];
	activeEmployeeCount: number;
	workPattern: WorkPattern;
}) {
	// single=終日(null)、multi=各シフトを対象に今日の配置を集計する
	const shiftIds = useMemo<(string | null)[]>(() => {
		const options = getShiftOptions(workPattern);
		return options.length > 0 ? options.map((o) => o.id) : [null];
	}, [workPattern]);

	const { data: assignments = [] } = useQuery({
		queryKey: ["home-assignments", today, shiftIds],
		queryFn: async () => {
			const results = await Promise.all(
				shiftIds.map((shiftId) => fetchAssignments({ date: today, shiftId })),
			);
			return results.flat();
		},
	});

	const confirmed = assignments.filter((a) => a.status === "confirmed");
	const assignedAreaIds = new Set(confirmed.map((a) => a.areaId));
	const assignedAreaCount = areas.filter((a) =>
		assignedAreaIds.has(a.id),
	).length;
	const unsetAreaCount = areas.length - assignedAreaCount;
	const assignedCount = confirmed.reduce(
		(sum, a) => sum + a.spotAssignments.length,
		0,
	);
	const totalSpots = areas.reduce((sum, a) => sum + a.spotCount, 0);
	const openSpots = Math.max(totalSpots - assignedCount, 0);

	const shiftLabel =
		workPattern.mode === "single"
			? "1交代（終日）"
			: `${workPattern.shifts.length}交代`;

	return (
		<div className="max-w-250">
			<div className="text-[22px] font-bold">ホーム</div>
			<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
				今日の配置状況のサマリーです。
			</div>

			<div className="grid grid-cols-4 gap-4">
				<StatCard
					label="配置済みエリア"
					value={`${assignedAreaCount} / ${areas.length}`}
					unit="エリア"
					sub={`未設定 ${unsetAreaCount} エリア`}
				/>
				<StatCard
					label="配置済み人数"
					value={String(assignedCount)}
					unit="名"
				/>
				<StatCard
					label="在籍従業員数"
					value={String(activeEmployeeCount)}
					unit="名"
				/>
				<StatCard
					label="未配置スポット数"
					value={String(openSpots)}
					sub={`全 ${totalSpots} スポット`}
				/>
			</div>

			<div className="mt-6 grid grid-cols-3 gap-4">
				<div className="col-span-1 bg-surface border border-border rounded-lg p-4.5 shadow-card">
					<div className="font-bold text-[15px]">シフト構成</div>
					<div className="text-[13px] text-muted mt-1">{shiftLabel}</div>
					{workPattern.shifts.length > 0 && (
						<ul className="mt-2.5 flex flex-col gap-1.5">
							{workPattern.shifts.map((s) => (
								<li
									key={s.id}
									className="flex items-center justify-between text-[13px]"
								>
									<span className="text-ink">{s.name}</span>
									<span className="text-faint">
										{s.startTime}–{s.endTime}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	unit,
	sub,
}: {
	label: string;
	value: string;
	unit?: string;
	sub?: string;
}) {
	return (
		<div className="bg-surface border border-border rounded-lg p-4.5 shadow-card">
			<div className="text-[13px] text-muted">{label}</div>
			<div className="mt-2 flex items-baseline gap-1">
				<span className="text-3xl font-bold text-ink">{value}</span>
				{unit && <span className="text-[13px] text-faint">{unit}</span>}
			</div>
			{sub && <div className="text-xs text-faint mt-1.5">{sub}</div>}
		</div>
	);
}
