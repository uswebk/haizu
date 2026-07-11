import { z } from "zod";

// Large-screen viewer display mode: manual = forced display / auto = auto display by work style
export const ViewerModeSchema = z.enum(["manual", "auto"]);
export type ViewerMode = z.infer<typeof ViewerModeSchema>;

export const ViewerConfigSchema = z.object({
	areaId: z.string().uuid(),
	mode: ViewerModeSchema,
	displayDate: z.string().date().nullable(), // Forced display date for manual
	shiftId: z.string().uuid().nullable(), // Forced display shift for manual (null = all day)
	shiftName: z.string().nullable(), // Shift name for shiftId (kept even if soft-deleted; for display)
	shiftStartTime: z.string().nullable(), // Start time HH:mm for shiftId (for display)
	shiftEndTime: z.string().nullable(), // End time HH:mm for shiftId (for display)
	leadMinutes: z.number().int(), // auto: offset from shift start (positive = minutes before / negative = minutes after)
});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

export const ViewerConfigInputSchema = z.object({
	mode: ViewerModeSchema,
	displayDate: z.string().date().nullable(),
	shiftId: z.string().uuid().nullable(),
	leadMinutes: z.number().int().min(-240).max(240), // positive = minutes before / negative = minutes after
});

export type ViewerConfigInput = z.infer<typeof ViewerConfigInputSchema>;
