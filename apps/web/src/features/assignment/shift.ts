import type { WorkPattern } from "@haiz/shared";

export type ShiftOption = { id: string; name: string };

export function todayStr(): string {
	const d = new Date();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

export function getShiftOptions(wp: WorkPattern | undefined): ShiftOption[] {
	if (!wp || wp.mode === "single") return [];
	return wp.shifts.map((s) => ({ id: s.id, name: s.name }));
}

// URL の shiftId と勤務体制から、実際に使うシフト（single時は null=終日）を決める
export function resolveEffectiveShift(
	wp: WorkPattern | undefined,
	searchShiftId: string | undefined,
): { shiftId: string | null; label: string } {
	if (!wp || wp.mode === "single") return { shiftId: null, label: "終日" };
	const options = wp.shifts;
	const selected =
		options.find((s) => s.id === searchShiftId) ?? options[0] ?? null;
	return selected
		? { shiftId: selected.id, label: selected.name }
		: { shiftId: null, label: "終日" };
}

const JP_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateLabel(date: string): string {
	const d = new Date(`${date}T00:00:00`);
	return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${JP_WEEK[d.getDay()]}）`;
}
