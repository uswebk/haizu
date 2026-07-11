import type { Assignment, Shift, WorkPattern } from "@haizu/shared";
import type { AreaListItem } from "#/lib/api/areas";
import { hmToMinutes, minutesOfDay, toDateStr } from "#/lib/datetime";

// A concrete shift instance: the shift definition plus the business date it belongs to.
// A shift that spans midnight belongs to its start date (e.g. 18:00–09:00 running at
// 02:00 belongs to the previous calendar day). shift === null means "all day" (single mode).
export type ShiftSlot = { shift: Shift | null; date: string };

// current is the slot in effect right now; next/previous are the surrounding instances.
// next/previous are null when there is nothing to cycle to (single mode or a lone shift).
export type ShiftCycle = {
	current: ShiftSlot;
	next: ShiftSlot | null;
	previous: ShiftSlot | null;
};

// Shift the "YYYY-MM-DD" calendar date by whole days, anchored at UTC noon to stay
// clear of timezone/DST boundaries.
function addDays(date: string, delta: number): string {
	const d = new Date(`${date}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}

// Resolve the shift in effect right now (with its business date), plus the ones before
// and after it. Multi-shift patterns cycle by start time and wrap across midnight.
export function resolveShiftCycle(wp: WorkPattern, now: Date): ShiftCycle {
	const today = toDateStr(now);
	if (wp.mode === "single" || wp.shifts.length === 0) {
		return {
			current: { shift: null, date: today },
			next: null,
			previous: null,
		};
	}

	const nowMin = minutesOfDay(now);
	const byStart = [...wp.shifts].sort(
		(a, b) => hmToMinutes(a.startTime) - hmToMinutes(b.startTime),
	);

	if (byStart.length === 1) {
		const shift = byStart[0];
		// Started earlier today, or (its start still ahead of now) it's the instance from yesterday.
		const date =
			hmToMinutes(shift.startTime) <= nowMin ? today : addDays(today, -1);
		return { current: { shift, date }, next: null, previous: null };
	}

	const n = byStart.length;
	// Largest start time <= now; if now is before every start, wrap to the last shift.
	let idx = n - 1;
	for (let i = 0; i < n; i++) {
		if (hmToMinutes(byStart[i].startTime) <= nowMin) idx = i;
	}
	// The current instance started yesterday when we wrapped past midnight (its start is still after now).
	const wrapped = hmToMinutes(byStart[idx].startTime) > nowMin;
	const currentDate = wrapped ? addDays(today, -1) : today;

	const nextIdx = (idx + 1) % n;
	const prevIdx = (idx - 1 + n) % n;
	return {
		current: { shift: byStart[idx], date: currentDate },
		// next wraps to the following day when it cycles back to the first shift
		next: {
			shift: byStart[nextIdx],
			date: nextIdx === 0 ? addDays(currentDate, 1) : currentDate,
		},
		// previous wraps to the day before when the current shift is the first of the day
		previous: {
			shift: byStart[prevIdx],
			date: idx === 0 ? addDays(currentDate, -1) : currentDate,
		},
	};
}

export type ShiftStatus = {
	publishedCount: number;
	placedAreaCount: number;
	unplacedAreaCount: number;
	placementPct: number;
	assignedCount: number;
	totalSpots: number;
	openSpots: number;
	unplacedAreas: AreaListItem[];
	draftAreaIds: Set<string>;
};

// Placement progress for a single shift, computed against the published areas.
// Only confirmed placements count as "placed"; drafts count as unplaced (but are flagged).
export function computeShiftStatus(
	assignments: Assignment[],
	publishedAreas: AreaListItem[],
): ShiftStatus {
	const publishedIds = new Set(publishedAreas.map((a) => a.id));
	const publishedCount = publishedAreas.length;

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

	const draftAreaIds = new Set(
		assignments
			.filter((a) => a.status === "draft" && publishedIds.has(a.areaId))
			.map((a) => a.areaId),
	);
	const unplacedAreas = publishedAreas.filter(
		(a) => !confirmedAreaIds.has(a.id),
	);

	return {
		publishedCount,
		placedAreaCount,
		unplacedAreaCount,
		placementPct,
		assignedCount,
		totalSpots,
		openSpots,
		unplacedAreas,
		draftAreaIds,
	};
}
