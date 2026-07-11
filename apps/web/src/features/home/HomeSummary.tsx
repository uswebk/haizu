import type { WorkPattern } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation(["home", "common"]);
	// single = all day (null), multi = aggregate today's placement across each shift
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

	// Aggregating before placement data loads would briefly show every area as unplaced
	if (isPending) {
		return <div className="text-muted text-sm">{t("common:loading")}</div>;
	}

	// Only areas with a published spec can be assigned; use these as the denominator
	const publishedAreas = areas.filter((a) => a.currentStatus === "published");
	const publishedCount = publishedAreas.length;
	const publishedIds = new Set(publishedAreas.map((a) => a.id));

	// Areas whose placement is confirmed today count as "placed" (draft placements count as unplaced)
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

	// Unplaced areas (published areas not confirmed today) and whether they have a draft
	const draftAreaIds = new Set(
		assignments
			.filter((a) => a.status === "draft" && publishedIds.has(a.areaId))
			.map((a) => a.areaId),
	);
	const unplacedAreas = publishedAreas.filter(
		(a) => !confirmedAreaIds.has(a.id),
	);

	// Label showing "for when / which shift" the placed areas are
	const shiftText =
		workPattern.mode === "single"
			? t("home:allDay")
			: workPattern.shifts
					.map((s) => `${s.name} ${s.startTime}〜${s.endTime}`)
					.join(" / ");

	return (
		<div className="max-w-250">
			<div className="text-[22px] font-bold">{t("home:title")}</div>
			<div className="text-lg font-bold text-ink mt-2 mb-4.5">
				{formatDateJp(today)}（{shiftText}）
				<span className="text-[13px] text-faint font-medium ml-2">
					{t("home:placementStatus")}
				</span>
			</div>

			<div className="grid grid-cols-5 gap-4">
				<StatCard
					className="col-span-2"
					label={t("home:placedAreas")}
					value={`${placedAreaCount} / ${publishedCount}`}
					unit={t("home:areaUnit")}
					valueColor={
						placementPct < 100 ? "var(--color-warning)" : "var(--color-success)"
					}
					progressPct={placementPct}
					progressFull={unplacedAreaCount === 0 && publishedCount > 0}
					progressLabel={t("home:placementRate", { pct: placementPct })}
					sub={
						unplacedAreaCount > 0 ? (
							<Link
								to="/s/$siteId/assignment"
								params={{ siteId }}
								className="text-[13px] font-bold text-primary hover:text-primary-hover"
							>
								{t("home:placeUnplaced", { count: unplacedAreaCount })}
							</Link>
						) : (
							t("home:allPlacedToday")
						)
					}
				/>
				<StatCard
					label={t("home:placedPeople")}
					value={String(assignedCount)}
					unit={t("home:personUnit")}
				/>
				<StatCard
					label={t("home:activeEmployees")}
					value={String(activeEmployeeCount)}
					unit={t("home:personUnit")}
				/>
				<StatCard
					label={t("home:openSpots")}
					value={String(openSpots)}
					sub={t("home:totalSpots", { count: totalSpots })}
				/>
			</div>

			{unplacedAreas.length > 0 && (
				<div className="mt-6 bg-surface border border-border rounded-lg shadow-card overflow-hidden">
					<div className="flex items-center justify-between px-4.5 py-3.5 border-b border-border">
						<div className="font-bold text-[15px]">
							{t("home:unplacedAreas", { count: unplacedAreas.length })}
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
											{isDraft ? t("home:hasDraft") : t("home:notStarted")}
										</span>
										<span className="ml-auto flex-none text-[13px] font-bold text-primary">
											{t("home:place")}
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
