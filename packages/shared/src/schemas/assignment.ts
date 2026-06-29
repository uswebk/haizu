import { z } from "zod";

export const AssignmentStatusSchema = z.enum(["draft", "confirmed"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

// スポットへの従業員割り当て
export const SpotAssignmentSchema = z.object({
  spotId: z.string().uuid(),
  employeeId: z.string().uuid().nullable(), // null = 未配置
});

export type SpotAssignment = z.infer<typeof SpotAssignmentSchema>;

// 配置決め（エリア × 日付 × シフト の単位）
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  areaId: z.string().uuid(),
  layoutSpecVersionId: z.string().uuid(), // 使用した規格バージョン
  date: z.string().date(), // yyyy-mm-dd
  shiftId: z.string().uuid(),
  status: AssignmentStatusSchema,
  spotAssignments: z.array(SpotAssignmentSchema),
  memo: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

// 変更ログ
export const AssignmentChangeLogSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  userId: z.string().uuid(),
  description: z.string(),
  createdAt: z.string().datetime(),
});

export type AssignmentChangeLog = z.infer<typeof AssignmentChangeLogSchema>;
