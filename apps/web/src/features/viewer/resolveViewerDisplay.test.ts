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

// Night shift runs past midnight (see docs/domain/assignment.md)
const overnight: WorkPattern = {
	mode: "multi",
	shifts: [
		{ id: "day", name: "日勤", startTime: "09:00", endTime: "19:00", order: 0 },
		{
			id: "night",
			name: "夜勤",
			startTime: "19:00",
			endTime: "09:00",
			order: 1,
		},
	],
};

// A shift starting just after midnight, so a lead time pushes its switch into the previous day
const earlyStart: WorkPattern = {
	mode: "multi",
	shifts: [
		{
			id: "early",
			name: "早番",
			startTime: "00:30",
			endTime: "12:00",
			order: 0,
		},
		{ id: "day", name: "日勤", startTime: "12:00", endTime: "00:30", order: 1 },
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

	it("auto は始業前は日跨ぎで直前のシフト（最後）を採用し、日付も前日に戻す", () => {
		// 08:00 is before the day-shift switch (09:00) -> wraps to the last Night shift,
		// which started the previous evening, so the date must roll back with it
		expect(resolveViewerDisplay(config({}), two, day(8))).toEqual({
			date: "2026-07-04",
			shiftId: "night",
		});
	});

	it("日跨ぎ夜勤の最中は、シフトが始まった前日の配置を表示する", () => {
		// 19:00-09:00 night shift seen at 03:00 -> the placement is keyed to the previous day
		expect(resolveViewerDisplay(config({}), overnight, day(3))).toEqual({
			date: "2026-07-04",
			shiftId: "night",
		});
		// Same shift before midnight resolves to the same calendar day it started on
		expect(resolveViewerDisplay(config({}), overnight, day(20))).toEqual({
			date: "2026-07-05",
			shiftId: "night",
		});
	});

	it("leadMinutes で日付を跨いで前倒しした場合は翌日の配置を表示する", () => {
		// Early shift starts 00:30; a 60-min lead moves its switch back to 23:30 the day before,
		// so at 23:40 we are already showing the shift that starts tomorrow
		const c = config({ leadMinutes: 60 });
		expect(resolveViewerDisplay(c, earlyStart, day(23, 40))).toEqual({
			date: "2026-07-06",
			shiftId: "early",
		});
		// Just after midnight it is the same shift, now starting on the current day
		expect(resolveViewerDisplay(c, earlyStart, day(0, 10))).toEqual({
			date: "2026-07-05",
			shiftId: "early",
		});
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
