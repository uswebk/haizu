import { z } from "zod";

// HH:mm 形式
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const ShiftSchema = z.object({
  id: z.string().uuid(),
  workPatternId: z.string().uuid(),
  name: z.string().min(1), // 日勤, 夜勤, 早番 など
  startTime: TimeSchema, // HH:mm
  endTime: TimeSchema, // HH:mm
  order: z.number().int().min(0),
});

export type Shift = z.infer<typeof ShiftSchema>;

export const WorkPatternTypeSchema = z.enum(["1_shift", "2_shift", "3_shift"]);
export type WorkPatternType = z.infer<typeof WorkPatternTypeSchema>;

export const WorkPatternSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  type: WorkPatternTypeSchema,
  shifts: z.array(ShiftSchema).min(1).max(3),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkPattern = z.infer<typeof WorkPatternSchema>;
