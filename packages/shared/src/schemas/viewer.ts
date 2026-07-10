import { z } from "zod";

// 大画面ビュアーの表示方法: manual=強制表示 / auto=働き方に合わせて自動表示
export const ViewerModeSchema = z.enum(["manual", "auto"]);
export type ViewerMode = z.infer<typeof ViewerModeSchema>;

export const ViewerConfigSchema = z.object({
	areaId: z.string().uuid(),
	mode: ViewerModeSchema,
	displayDate: z.string().date().nullable(), // manual の強制表示日付
	shiftId: z.string().uuid().nullable(), // manual の強制表示シフト（null=終日）
	shiftName: z.string().nullable(), // shiftId のシフト名（ソフト削除済みでも保持。表示用）
	shiftStartTime: z.string().nullable(), // shiftId の開始時刻 HH:mm（表示用）
	shiftEndTime: z.string().nullable(), // shiftId の終了時刻 HH:mm（表示用）
	leadMinutes: z.number().int(), // auto: シフト開始からのオフセット（正=分前 / 負=分後）
});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

export const ViewerConfigInputSchema = z.object({
	mode: ViewerModeSchema,
	displayDate: z.string().date().nullable(),
	shiftId: z.string().uuid().nullable(),
	leadMinutes: z.number().int().min(-240).max(240), // 正=分前 / 負=分後
});

export type ViewerConfigInput = z.infer<typeof ViewerConfigInputSchema>;
