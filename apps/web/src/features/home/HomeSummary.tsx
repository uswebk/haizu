import type { Assignment, WorkPattern } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AreaListItem } from "#/lib/api/areas";
import { fetchAssignments } from "#/lib/api/assignments";
import { formatDateJp } from "#/lib/datetime";
import { ShiftStatusSection } from "./ShiftStatusSection";
import {
	computeShiftStatus,
	resolveShiftCycle,
	type ShiftSlot,
} from "./shiftCycle";

// Cache/lookup key for a shift instance (its date + shift, "none" for the all-day bucket).
const slotKey = (slot: ShiftSlot) =>
	`${slot.date}::${slot.shift?.id ?? "none"}`;

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

	const cycle = useMemo(
		() => resolveShiftCycle(workPattern, new Date()),
		[workPattern],
	);

	// Each shift instance carries its own business date, so fetch per (date, shift) slot, deduped.
	const slots = useMemo<ShiftSlot[]>(() => {
		const all = [cycle.current, cycle.next, cycle.previous].filter(
			(s): s is ShiftSlot => s != null,
		);
		const seen = new Set<string>();
		return all.filter((s) => {
			const k = slotKey(s);
			if (seen.has(k)) return false;
			seen.add(k);
			return true;
		});
	}, [cycle]);

	const { data: byShift = {}, isPending } = useQuery({
		queryKey: ["home-assignments", slots.map(slotKey)],
		queryFn: async () => {
			const results = await Promise.all(
				slots.map(async (slot) => {
					const assignments = await fetchAssignments({
						date: slot.date,
						shiftId: slot.shift?.id ?? null,
					});
					return [slotKey(slot), assignments] as const;
				}),
			);
			return Object.fromEntries(results) as Record<string, Assignment[]>;
		},
	});

	// Aggregating before placement data loads would briefly show every area as unplaced
	if (isPending) {
		return <div className="text-muted text-sm">{t("common:loading")}</div>;
	}

	const publishedAreas = areas.filter((a) => a.currentStatus === "published");
	const totalSpots = publishedAreas.reduce((sum, a) => sum + a.spotCount, 0);

	const statusFor = (slot: ShiftSlot) =>
		computeShiftStatus(byShift[slotKey(slot)] ?? [], publishedAreas);

	return (
		<div className="max-w-250">
			<div className="text-[22px] font-bold">{t("home:title")}</div>
			<div className="text-lg font-bold text-ink mt-2 mb-4.5">
				{formatDateJp(today)}
				<span className="text-[13px] text-faint font-medium ml-2">
					{t("home:placementStatus")}
				</span>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<GlobalStat
					label={t("home:activeEmployees")}
					value={String(activeEmployeeCount)}
					unit={t("home:personUnit")}
				/>
				<GlobalStat
					label={t("home:publishedAreas")}
					value={String(publishedAreas.length)}
					unit={t("home:areaUnit")}
				/>
				<GlobalStat
					label={t("home:totalSpotsLabel")}
					value={String(totalSpots)}
					unit={t("home:spotUnit")}
				/>
			</div>

			<ShiftStatusSection
				variant="current"
				slot={cycle.current}
				status={statusFor(cycle.current)}
				siteId={siteId}
			/>
			{cycle.next && (
				<ShiftStatusSection
					variant="next"
					slot={cycle.next}
					status={statusFor(cycle.next)}
					siteId={siteId}
				/>
			)}
			{cycle.previous && (
				<ShiftStatusSection
					variant="previous"
					slot={cycle.previous}
					status={statusFor(cycle.previous)}
					siteId={siteId}
				/>
			)}
		</div>
	);
}

function GlobalStat({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit?: string;
}) {
	return (
		<div className="bg-surface border border-border rounded-lg p-4.5 shadow-card">
			<div className="text-[13px] text-muted">{label}</div>
			<div className="mt-2 flex items-baseline gap-1">
				<span className="text-3xl font-bold text-ink">{value}</span>
				{unit && <span className="text-[13px] text-faint">{unit}</span>}
			</div>
		</div>
	);
}
