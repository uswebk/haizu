import { z } from "zod";

// 管理タグ（拠点単位で管理）
export const EmployeeTagSchema = z.object({
	id: z.string().uuid(),
	siteId: z.string().uuid(),
	name: z.string().min(1),
});

export type EmployeeTag = z.infer<typeof EmployeeTagSchema>;

export const EmployeeSchema = z.object({
	id: z.string().uuid(),
	siteId: z.string().uuid(),
	code: z.string().min(1), // 従業員コード（拠点内で一意）
	lastName: z.string().min(1),
	firstName: z.string().min(1),
	avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	hiredAt: z.string().date().nullable(),
	retiredAt: z.string().date().nullable(), // 拠点管理者以上のみ参照可
	tagIds: z.array(z.string().uuid()),
	isActive: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
