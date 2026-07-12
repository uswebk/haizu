import type { Shift, WorkPattern } from "@haizu/shared";
import { describe, expect, it } from "vitest";
import { resolveShiftCycle } from "./shiftCycle";

function shift(overrides: Partial<Shift> & Pick<Shift, "startTime">): Shift {
	return {
		id: overrides.id ?? overrides.startTime,
		name: overrides.name ?? overrides.startTime,
		endTime: overrides.endTime ?? "00:00",
		order: overrides.order ?? 0,
		...overrides,
	};
}

const day = shift({ id: "day", startTime: "09:00", endTime: "18:00" });
const evening = shift({ id: "evening", startTime: "18:00", endTime: "22:00" });
const night = shift({ id: "night", startTime: "22:00", endTime: "06:00" });

function multi(shifts: Shift[]): WorkPattern {
	return { mode: "multi", shifts };
}

// A Date whose device-local time is 2026-07-12 HH:MM (July has no DST in the runtime TZ).
function at(hhmm: string): Date {
	const [h, m] = hhmm.split(":").map(Number);
	return new Date(2026, 6, 12, h, m);
}

describe("resolveShiftCycle", () => {
	it("returns an all-day current slot for a single-mode pattern", () => {
		const wp: WorkPattern = { mode: "single", shifts: [] };
		expect(resolveShiftCycle(wp, at("12:00"))).toEqual({
			current: { shift: null, date: "2026-07-12" },
			next: null,
			previous: null,
		});
	});

	it("returns only current for a lone shift", () => {
		const cycle = resolveShiftCycle(multi([day]), at("12:00"));
		expect(cycle.current).toEqual({ shift: day, date: "2026-07-12" });
		expect(cycle.next).toBeNull();
		expect(cycle.previous).toBeNull();
	});

	it("dates a lone midnight-spanning shift to its start date after midnight", () => {
		// Night 18:00–09:00 running at 03:00 belongs to the previous day.
		const nightWide = shift({ id: "n", startTime: "18:00", endTime: "09:00" });
		const cycle = resolveShiftCycle(multi([nightWide]), at("03:00"));
		expect(cycle.current).toEqual({ shift: nightWide, date: "2026-07-11" });
	});

	it("resolves the shift in effect during the day with correct neighbors and dates", () => {
		const cycle = resolveShiftCycle(multi([day, evening, night]), at("12:00"));
		expect(cycle.current).toEqual({ shift: day, date: "2026-07-12" });
		expect(cycle.next).toEqual({ shift: evening, date: "2026-07-12" });
		// The previous instance (last night's shift) belongs to the previous day.
		expect(cycle.previous).toEqual({ shift: night, date: "2026-07-11" });
	});

	it("wraps to the previous day's last shift after midnight", () => {
		const cycle = resolveShiftCycle(multi([day, evening, night]), at("03:00"));
		expect(cycle.current).toEqual({ shift: night, date: "2026-07-11" });
		// Next is today's first shift.
		expect(cycle.next).toEqual({ shift: day, date: "2026-07-12" });
		expect(cycle.previous).toEqual({ shift: evening, date: "2026-07-11" });
	});

	it("resolves the night shift at its start (same day) and wraps next to tomorrow", () => {
		const cycle = resolveShiftCycle(multi([day, evening, night]), at("23:00"));
		expect(cycle.current).toEqual({ shift: night, date: "2026-07-12" });
		expect(cycle.next).toEqual({ shift: day, date: "2026-07-13" });
		expect(cycle.previous).toEqual({ shift: evening, date: "2026-07-12" });
	});

	it("is independent of the input order of shifts", () => {
		const cycle = resolveShiftCycle(multi([night, day, evening]), at("19:00"));
		expect(cycle.current).toEqual({ shift: evening, date: "2026-07-12" });
		expect(cycle.next).toEqual({ shift: night, date: "2026-07-12" });
		expect(cycle.previous).toEqual({ shift: day, date: "2026-07-12" });
	});
});
