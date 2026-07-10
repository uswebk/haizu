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
	planAspectRatio: z.number().positive().optional(), // 幅/高さ比（例: 4/3 → 1.333）。画像アップロード時に保存
	planImageScale: z.number().positive().default(1), // 図面画像の表示倍率（手動拡大縮小）
	planImageOffsetX: z.number().default(0), // 図面画像の表示位置オフセット（キャンバス幅に対する%）
	planImageOffsetY: z.number().default(0), // 図面画像の表示位置オフセット（キャンバス高さに対する%）
	spots: z.array(SpotSchema).max(100),
	publishedAt: z.string().datetime().nullable(),
	effectiveDate: z.string().date(), // 配置決めがこのバージョンを適用し始める日（未公開時は "1000-01-01"）
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type LayoutSpecVersion = z.infer<typeof LayoutSpecVersionSchema>;
