import { z } from "zod";

export const AssignmentStatusSchema = z.enum(["draft", "confirmed"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const SpotAssignmentSchema = z.object({
	spotId: z.string().uuid(),
	employeeId: z.string().uuid(),
});

export type SpotAssignment = z.infer<typeof SpotAssignmentSchema>;

export const AssignmentSchema = z.object({
	id: z.string().uuid(),
	areaId: z.string().uuid(),
	layoutSpecVersionId: z.string().uuid(), // The spec version used
	date: z.string().date(), // yyyy-mm-dd
	shiftId: z.string().uuid().nullable(),
	status: AssignmentStatusSchema,
	spotAssignments: z.array(SpotAssignmentSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

export const AssignmentInputSchema = z.object({
	areaId: z.string().uuid(),
	layoutSpecVersionId: z.string().uuid(),
	date: z.string().date(),
	shiftId: z.string().uuid().nullable(),
	status: AssignmentStatusSchema,
	spotAssignments: z.array(SpotAssignmentSchema),
});

export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;

export const AssignmentChangeLogSchema = z.object({
	id: z.string().uuid(),
	assignmentId: z.string().uuid(),
	userId: z.string().uuid(),
	description: z.string(),
	createdAt: z.string().datetime(),
});

export type AssignmentChangeLog = z.infer<typeof AssignmentChangeLogSchema>;
