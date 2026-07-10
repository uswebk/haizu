import type { WorkPattern } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { getShiftOptions } from "#/features/assignment/shift";
import type { AreaListItem } from "#/lib/api/areas";
import { fetchAssignments } from "#/lib/api/assignments";
import { formatDateJp } from "#/lib/datetime";

export function HomeSummary({
	siteId,
	today,
	areas,
	activeEmployeeCount,
	workPattern,
}: {
	siteId: string;
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

	const { data: assignments = [], isPending } = useQuery({
		queryKey: ["home-assignments", today, shiftIds],
		queryFn: async () => {
			const results = await Promise.all(
				shiftIds.map((shiftId) => fetchAssignments({ date: today, shiftId })),
			);
			return results.flat();
		},
	});

	// 配置データが未取得のうちに集計すると全エリアが未配置として一瞬表示される
	if (isPending) {
		return <div className="text-muted text-sm">読み込み中...</div>;
	}

	// 配置に使えるのは規格が公開済みのエリアのみ。これを分母にする
	const publishedAreas = areas.filter((a) => a.currentStatus === "published");
	const publishedCount = publishedAreas.length;
	const publishedIds = new Set(publishedAreas.map((a) => a.id));

	// 今日の配置が確定(confirmed)しているエリアを「配置済み」とする（下書き配置は未配置扱い）
	const confirmed = assignments.filter(
		(a) => a.status === "confirmed" && publishedIds.has(a.areaId),
	);
	const confirmedAreaIds = new Set(confirmed.map((a) => a.areaId));
	const placedAreaCount = publishedAreas.filter((a) =>
		confirmedAreaIds.has(a.id),
	).length;
	const unplacedAreaCount = publishedCount - placedAreaCount;
	const placementPct =
		publishedCount > 0
			? Math.round((placedAreaCount / publishedCount) * 100)
			: 0;

	const assignedCount = confirmed.reduce(
		(sum, a) => sum + a.spotAssignments.length,
		0,
	);
	const totalSpots = publishedAreas.reduce((sum, a) => sum + a.spotCount, 0);
	const openSpots = Math.max(totalSpots - assignedCount, 0);

	// 未配置（今日 confirmed でない公開エリア）と、その下書き有無
	const draftAreaIds = new Set(
		assignments
			.filter((a) => a.status === "draft" && publishedIds.has(a.areaId))
			.map((a) => a.areaId),
	);
	const unplacedAreas = publishedAreas.filter(
		(a) => !confirmedAreaIds.has(a.id),
	);

	// 配置済みエリアが「いつ・どのシフトの分か」を示すラベル
	const shiftText =
		workPattern.mode === "single"
			? "終日"
			: workPattern.shifts
					.map((s) => `${s.name} ${s.startTime}〜${s.endTime}`)
					.join(" / ");

	return (
		<div className="max-w-250">
			<div className="text-[22px] font-bold">ホーム</div>
			<div className="text-lg font-bold text-ink mt-2 mb-4.5">
				{formatDateJp(today)}（{shiftText}）
				<span className="text-[13px] text-faint font-medium ml-2">
					の配置状況
				</span>
			</div>

			<div className="grid grid-cols-5 gap-4">
				<StatCard
					className="col-span-2"
					label="配置済みエリア"
					value={`${placedAreaCount} / ${publishedCount}`}
					unit="エリア"
					valueColor={
						placementPct < 100 ? "var(--color-warning)" : "var(--color-success)"
					}
					progressPct={placementPct}
					progressFull={unplacedAreaCount === 0 && publishedCount > 0}
					progressLabel={`配置率 ${placementPct}%`}
					sub={
						unplacedAreaCount > 0 ? (
							<Link
								to="/s/$siteId/assignment"
								params={{ siteId }}
								className="text-[13px] font-bold text-primary hover:text-primary-hover"
							>
								未配置 {unplacedAreaCount} エリアを配置 →
							</Link>
						) : (
							"本日の配置は完了"
						)
					}
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

			{unplacedAreas.length > 0 && (
				<div className="mt-6 bg-surface border border-border rounded-lg shadow-card overflow-hidden">
					<div className="flex items-center justify-between px-4.5 py-3.5 border-b border-border">
						<div className="font-bold text-[15px]">
							未配置のエリア（{unplacedAreas.length}）
						</div>
					</div>
					<ul>
						{unplacedAreas.map((area) => {
							const isDraft = draftAreaIds.has(area.id);
							return (
								<li
									key={area.id}
									className="border-b border-hairline last:border-b-0"
								>
									<Link
										to="/s/$siteId/assignment/$areaId"
										params={{ siteId, areaId: area.id }}
										search={{ date: today }}
										className="flex items-center gap-3 px-4.5 py-3 hover:bg-hairline transition-colors duration-150"
									>
										<span className="font-bold text-[14px] text-ink min-w-0 truncate">
											{area.name}
										</span>
										<span
											className={`flex-none text-[11px] font-bold px-2 py-0.5 rounded-pill ${
												isDraft
													? "text-warning bg-warning-soft"
													: "text-faint bg-empty-bg"
											}`}
										>
											{isDraft ? "下書きあり" : "未着手"}
										</span>
										<span className="ml-auto flex-none text-[13px] font-bold text-primary">
											配置する →
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
}

function StatCard({
	label,
	value,
	unit,
	sub,
	className,
	valueColor,
	progressPct,
	progressFull,
	progressLabel,
}: {
	label: string;
	value: string;
	unit?: string;
	sub?: ReactNode;
	className?: string;
	valueColor?: string;
	progressPct?: number;
	progressFull?: boolean;
	progressLabel?: ReactNode;
}) {
	return (
		<div
			className={`bg-surface border border-border rounded-lg p-4.5 shadow-card${className ? ` ${className}` : ""}`}
		>
			<div className="text-[13px] text-muted">{label}</div>
			<div className="mt-2 flex items-baseline gap-1">
				<span
					className="text-3xl font-bold text-ink"
					style={valueColor ? { color: valueColor } : undefined}
				>
					{value}
				</span>
				{unit && <span className="text-[13px] text-faint">{unit}</span>}
			</div>
			{typeof progressPct === "number" && (
				<>
					{progressLabel && (
						<div className="flex justify-end mt-3 mb-1.5 text-xs font-bold text-muted">
							{progressLabel}
						</div>
					)}
					<div className="h-1.75 rounded-pill bg-hairline overflow-hidden">
						<div
							className="h-full rounded-pill"
							style={{
								width: `${progressPct}%`,
								background: progressFull
									? "var(--color-success)"
									: "var(--color-primary)",
							}}
						/>
					</div>
				</>
			)}
			{sub && <div className="text-xs text-faint mt-1.5">{sub}</div>}
		</div>
	);
}
