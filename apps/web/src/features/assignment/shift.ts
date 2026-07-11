import type { WorkPattern } from "@haizu/shared";
import i18n from "#/i18n/config";

export type ShiftOption = { id: string; name: string };

const allDayLabel = () => i18n.t("assignment:allDay");

export function getShiftOptions(
	wp: WorkPattern | null | undefined,
): ShiftOption[] {
	if (!wp || wp.mode === "single") return [];
	return wp.shifts.map((s) => ({ id: s.id, name: s.name }));
}

// URL の shiftId と勤務体制から、実際に使うシフト（single時は null=終日）を決める
export function resolveEffectiveShift(
	wp: WorkPattern | null | undefined,
	searchShiftId: string | undefined,
): { shiftId: string | null; label: string } {
	if (!wp || wp.mode === "single")
		return { shiftId: null, label: allDayLabel() };
	const options = wp.shifts;
	const selected =
		options.find((s) => s.id === searchShiftId) ?? options[0] ?? null;
	return selected
		? { shiftId: selected.id, label: selected.name }
		: { shiftId: null, label: "終日" };
}
