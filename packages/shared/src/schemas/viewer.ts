import { z } from "zod";

// 大画面ビュアーの表示方法: manual=強制表示 / auto=働き方に合わせて自動表示
export const ViewerModeSchema = z.enum(["manual", "auto"]);
export type ViewerMode = z.infer<typeof ViewerModeSchema>;

export const ViewerConfigSchema = z.object({
  areaId: z.string().uuid(),
  mode: ViewerModeSchema,
  displayDate: z.string().date().nullable(), // manual の強制表示日付
  shiftId: z.string().uuid().nullable(), // manual の強制表示シフト（null=終日）
  leadMinutes: z.number().int(), // auto: シフト開始の何分前から表示
});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

export const ViewerConfigInputSchema = z.object({
  mode: ViewerModeSchema,
  displayDate: z.string().date().nullable(),
  shiftId: z.string().uuid().nullable(),
  leadMinutes: z.number().int().min(0).max(240),
});

export type ViewerConfigInput = z.infer<typeof ViewerConfigInputSchema>;
