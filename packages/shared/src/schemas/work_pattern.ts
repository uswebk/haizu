import { z } from "zod";

// HH:mm 形式
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const ShiftModeSchema = z.enum(["single", "multi"]);
export type ShiftMode = z.infer<typeof ShiftModeSchema>;

export const ShiftSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1), // 日勤, 夜勤, 早番 など
	startTime: TimeSchema, // HH:mm
	endTime: TimeSchema, // HH:mm
	order: z.number().int().min(0),
});

export type Shift = z.infer<typeof ShiftSchema>;

export const WorkPatternSchema = z.object({
	mode: ShiftModeSchema,
	shifts: z.array(ShiftSchema),
});

export type WorkPattern = z.infer<typeof WorkPatternSchema>;

// 保存（PUT）入力: id を送れば既存シフトを保持（未指定は新規）。order はサーバが採番する
export const ShiftInputSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1),
	startTime: TimeSchema,
	endTime: TimeSchema,
});

export type ShiftInput = z.infer<typeof ShiftInputSchema>;

export const WorkPatternInputSchema = z
	.object({
		mode: ShiftModeSchema,
		shifts: z.array(ShiftInputSchema),
	})
	.refine(
		(v) => {
			// 開始・終了が完全に同じシフトは重複登録できない
			const seen = new Set<string>();
			for (const s of v.shifts) {
				const key = `${s.startTime}-${s.endTime}`;
				if (seen.has(key)) return false;
				seen.add(key);
			}
			return true;
		},
		{ message: "開始・終了が同じシフトは登録できません", path: ["shifts"] },
	)
	.refine(
		(v) => {
			// シフト名は重複登録できない
			const seen = new Set<string>();
			for (const s of v.shifts) {
				if (seen.has(s.name)) return false;
				seen.add(s.name);
			}
			return true;
		},
		{ message: "シフト名が重複しています", path: ["shifts"] },
	);

export type WorkPatternInput = z.infer<typeof WorkPatternInputSchema>;
