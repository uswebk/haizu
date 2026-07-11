import type { ViewerConfig, WorkPattern } from "@haizu/shared";
import { hmToMinutes, minutesOfDay, toDateStr } from "#/lib/datetime";

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
	// Each shift's switch time = start time - leadMinutes (positive = earlier). Normalized over 24 hours.
	const switches = shifts
		.map((s) => ({
			id: s.id,
			at: mod(hmToMinutes(s.startTime) - config.leadMinutes, DAY),
		}))
		.sort((a, b) => a.at - b.at);

	// Take the largest switch time <= now. If none, wrap to the last shift (largest at) across the day boundary.
	let active = switches[switches.length - 1];
	for (const s of switches) {
		if (s.at <= nowMin) active = s;
	}
	return { date, shiftId: active.id };
}
