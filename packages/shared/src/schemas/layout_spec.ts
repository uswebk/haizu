import { z } from "zod";

// Layout area
export const AreaSchema = z.object({
	id: z.string().uuid(),
	siteId: z.string().uuid(),
	name: z.string().min(1), // e.g. Inspection room, Line A
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type Area = z.infer<typeof AreaSchema>;

// Placement spot (exists within a spec version)
export const SpotSchema = z.object({
	id: z.string().uuid(),
	layoutSpecVersionId: z.string().uuid(),
	label: z.string().min(1),
	x: z.number().min(0).max(100), // Position on the floor plan (%)
	y: z.number().min(0).max(100),
	size: z.number().int().min(40).max(200), // px
	order: z.number().int().min(0),
});

export type Spot = z.infer<typeof SpotSchema>;

export const LayoutSpecStatusSchema = z.enum(["draft", "published"]);
export type LayoutSpecStatus = z.infer<typeof LayoutSpecStatusSchema>;

// Spec version
export const LayoutSpecVersionSchema = z.object({
	id: z.string().uuid(),
	areaId: z.string().uuid(),
	version: z.number().int().min(1),
	status: LayoutSpecStatusSchema,
	planImageUrl: z.string().url().nullable(),
	planImageName: z.string().nullable(),
	planAspectRatio: z.number().positive().optional(), // Width/height ratio (e.g. 4/3 -> 1.333). Saved when an image is uploaded
	planImageScale: z.number().positive().default(1), // Display scale of the floor plan image (manual zoom)
	planImageOffsetX: z.number().default(0), // Floor plan image position offset (% of canvas width)
	planImageOffsetY: z.number().default(0), // Floor plan image position offset (% of canvas height)
	spots: z.array(SpotSchema).max(100),
	publishedAt: z.string().datetime().nullable(),
	effectiveDate: z.string().date(), // Date assignment starts applying this version (unpublished = "1000-01-01")
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type LayoutSpecVersion = z.infer<typeof LayoutSpecVersionSchema>;
