import type { ViewerConfig, WorkPattern } from "@haizu/shared";
import { describe, expect, it } from "vitest";
import { resolveViewerDisplay } from "./resolveViewerDisplay";

const day = (h: number, m = 0) => new Date(2026, 6, 5, h, m);

function config(over: Partial<ViewerConfig>): ViewerConfig {
	return {
		areaId: "a1",
		mode: "auto",
		displayDate: null,
		shiftId: null,
		shiftName: null,
		shiftStartTime: null,
		shiftEndTime: null,
		leadMinutes: 0,
		...over,
	};
}

const single: WorkPattern = { mode: "single", shifts: [] };
const two: WorkPattern = {
	mode: "multi",
	shifts: [
		{ id: "day", name: "日勤", startTime: "09:00", endTime: "18:00", order: 0 },
		{
			id: "night",
			name: "夜勤",
			startTime: "18:00",
			endTime: "22:00",
			order: 1,
		},
	],
};

describe("resolveViewerDisplay", () => {
	it("manual は固定の日付・シフトを返す", () => {
		const c = config({
			mode: "manual",
			displayDate: "2026-07-01",
			shiftId: "s9",
		});
		expect(resolveViewerDisplay(c, two, day(3))).toEqual({
			date: "2026-07-01",
			shiftId: "s9",
		});
	});

	it("manual で displayDate 未設定なら当日", () => {
		const c = config({ mode: "manual", displayDate: null, shiftId: "s9" });
		expect(resolveViewerDisplay(c, two, day(3))).toEqual({
			date: "2026-07-05",
			shiftId: "s9",
		});
	});

	it("auto 単一モードは終日(shiftId=null)", () => {
		expect(
			resolveViewerDisplay(config({}), single, day(10)).shiftId,
		).toBeNull();
	});

	it("auto は現在時刻の属するシフトを選ぶ", () => {
		expect(resolveViewerDisplay(config({}), two, day(10)).shiftId).toBe("day");
		expect(resolveViewerDisplay(config({}), two, day(19)).shiftId).toBe(
			"night",
		);
	});

	it("auto は始業前は日跨ぎで直前のシフト（最後）を採用", () => {
		// 08:00 is before the day-shift switch (09:00) -> wraps to the last Night shift
		expect(resolveViewerDisplay(config({}), two, day(8)).shiftId).toBe("night");
	});

	it("leadMinutes 正(分前)で早く次シフトへ切り替わる", () => {
		// 30-min-before setting: 08:45 is past the day-shift switch (08:30), so Day
		const c = config({ leadMinutes: 30 });
		expect(resolveViewerDisplay(c, two, day(8, 45)).shiftId).toBe("day");
	});

	it("leadMinutes 負(分後)で遅く切り替わる", () => {
		// 30-min-after setting: 09:15 is still before the day-shift switch (09:30) -> stays Night via wrap
		const c = config({ leadMinutes: -30 });
		expect(resolveViewerDisplay(c, two, day(9, 15)).shiftId).toBe("night");
	});
});
