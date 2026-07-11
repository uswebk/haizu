import type { ViewerConfig, WorkPattern } from "@haizu/shared";
import { hmToMinutes, minutesOfDay, toDateStr } from "#/lib/datetime";

export type ViewerDisplay = { date: string; shiftId: string | null };

const DAY = 1440;
const mod = (n: number, m: number) => ((n % m) + m) % m;

// エリアのビュアー設定から、いま表示すべき配置の日付・シフトを解決する。
// manual=強制表示（固定の日付・シフト）、auto=現在時刻に応じて今日のシフトを選ぶ。
// leadMinutes は正=分前（シフト開始より前に切替）／負=分後（遅らせて切替）。
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
	// 各シフトの切替時刻 = 開始時刻 - leadMinutes（正=前倒し）。24時間で正規化。
	const switches = shifts
		.map((s) => ({
			id: s.id,
			at: mod(hmToMinutes(s.startTime) - config.leadMinutes, DAY),
		}))
		.sort((a, b) => a.at - b.at);

	// now 以下で最大の切替を採用。無ければ日跨ぎで最後（最大 at）のシフト。
	let active = switches[switches.length - 1];
	for (const s of switches) {
		if (s.at <= nowMin) active = s;
	}
	return { date, shiftId: active.id };
}
