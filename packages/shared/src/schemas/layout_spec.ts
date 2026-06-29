import { z } from "zod";

// 配置エリア
export const AreaSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().min(1), // 検収室, ラインA など
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Area = z.infer<typeof AreaSchema>;

// 配置スポット（規格バージョン内に存在）
export const SpotSchema = z.object({
  id: z.string().uuid(),
  layoutSpecVersionId: z.string().uuid(),
  label: z.string().min(1),
  x: z.number().min(0).max(100), // 図面上の位置（%）
  y: z.number().min(0).max(100),
  size: z.number().int().min(40).max(200), // px
  order: z.number().int().min(0),
});

export type Spot = z.infer<typeof SpotSchema>;

export const LayoutSpecStatusSchema = z.enum(["draft", "published"]);
export type LayoutSpecStatus = z.infer<typeof LayoutSpecStatusSchema>;

// 規格バージョン
export const LayoutSpecVersionSchema = z.object({
  id: z.string().uuid(),
  areaId: z.string().uuid(),
  version: z.number().int().min(1),
  status: LayoutSpecStatusSchema,
  planImageUrl: z.string().url().nullable(),
  planImageName: z.string().nullable(),
  spots: z.array(SpotSchema).max(100),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LayoutSpecVersion = z.infer<typeof LayoutSpecVersionSchema>;
