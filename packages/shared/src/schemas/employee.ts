import { z } from "zod";

// Management tag (managed per site)
export const EmployeeTagSchema = z.object({
	id: z.string().uuid(),
	siteId: z.string().uuid(),
	name: z.string().min(1),
});

export type EmployeeTag = z.infer<typeof EmployeeTagSchema>;

export const EmployeeSchema = z.object({
	id: z.string().uuid(),
	siteId: z.string().uuid(),
	code: z.string().min(1), // Employee code (unique within a site)
	lastName: z.string().min(1),
	firstName: z.string().min(1),
	avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	hiredAt: z.string().date().nullable(),
	retiredAt: z.string().date().nullable(), // Visible only to site admins and above
	tagIds: z.array(z.string().uuid()),
	isActive: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
