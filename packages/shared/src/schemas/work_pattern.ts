import { z } from "zod";

// HH:mm format
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const ShiftModeSchema = z.enum(["single", "multi"]);
export type ShiftMode = z.infer<typeof ShiftModeSchema>;

export const ShiftSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1), // e.g. Day, Night, Early
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

// Save (PUT) input: sending id keeps the existing shift (omit for new). order is assigned by the server
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
			// Shifts with identical start and end times can't be registered twice
			const seen = new Set<string>();
			for (const s of v.shifts) {
				const key = `${s.startTime}-${s.endTime}`;
				if (seen.has(key)) return false;
				seen.add(key);
			}
			return true;
		},
		{
			message: "Shifts with the same start and end time can't be registered",
			path: ["shifts"],
		},
	)
	.refine(
		(v) => {
			// Shift names can't be duplicated
			const seen = new Set<string>();
			for (const s of v.shifts) {
				if (seen.has(s.name)) return false;
				seen.add(s.name);
			}
			return true;
		},
		{ message: "Shift names must be unique", path: ["shifts"] },
	);

export type WorkPatternInput = z.infer<typeof WorkPatternInputSchema>;
