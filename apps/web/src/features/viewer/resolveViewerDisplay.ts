import type { ViewerConfig, WorkPattern } from "@haizu/shared";
import {
	addDaysStr,
	hmToMinutes,
	minutesOfDay,
	toDateStr,
} from "#/lib/datetime";

export type ViewerDisplay = { date: string; shiftId: string | null };

const DAY = 1440;
const mod = (n: number, m: number) => ((n % m) + m) % m;

// From an area's viewer settings, resolve the date/shift of the placement to show right now.
// manual = forced display (fixed date/shift); auto = pick today's shift based on the current time.
// leadMinutes: positive = minutes before (switch before the shift starts) / negative = minutes after (switch later).
export function resolveViewerDisplay(
	config: ViewerConfig,
	workPattern: WorkPattern | null | undefined,
	now: Date,
): ViewerDisplay {
	if (config.mode === "manual") {
		return {
			date: config.displayDate ?? toDateStr(now),
			shiftId: config.shiftId,
		};
	}

	const date = toDateStr(now);
	if (!workPattern || workPattern.mode === "single") {
		return { date, shiftId: null };
	}
	const shifts = workPattern.shifts;
	if (shifts.length === 0) return { date, shiftId: null };

	const nowMin = minutesOfDay(now);
	const switches = shifts
		.map((s) => {
			// Switch time = start - leadMinutes (positive = earlier), which can fall outside today.
			// startDayOffset records which day the shift itself starts on, relative to the day its
			// switch lands on: a lead that reaches back past midnight makes the shift start the next
			// day (+1), a negative lead reaching past midnight makes it the previous day (-1).
			const raw = hmToMinutes(s.startTime) - config.leadMinutes;
			return {
				id: s.id,
				at: mod(raw, DAY),
				startDayOffset: -Math.floor(raw / DAY),
			};
		})
		.sort((a, b) => a.at - b.at);

	// Take the largest switch time <= now. If none, wrap to the last shift (largest at) across the day boundary.
	let active = switches[switches.length - 1];
	let switchDayOffset = -1;
	for (const s of switches) {
		if (s.at <= nowMin) {
			active = s;
			switchDayOffset = 0;
		}
	}

	// Placements are keyed by the date the shift starts, so an overnight shift still running past
	// midnight (e.g. 19:00-09:00 seen at 03:00) must resolve to yesterday's date, not today's.
	const dayOffset = switchDayOffset + active.startDayOffset;
	return {
		date: dayOffset === 0 ? date : addDaysStr(now, dayOffset),
		shiftId: active.id,
	};
}
