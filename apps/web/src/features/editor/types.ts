// effectiveDate placeholder for unpublished versions (matches the DB default value)
export const UNPUBLISHED_EFFECTIVE_DATE = "1000-01-01";

export type SpotState = {
	id: string;
	label: string;
	x: number; // % of canvas width
	y: number; // % of canvas height
	size: number; // px at zoom 1.0
};

export type VersionState = {
	id: string;
	label: string;
	status: "draft" | "published";
	effectiveDate: string; // "1000-01-01" while unpublished
	planImageUrl: string | null;
	planImageName: string | null;
	planAspectRatio?: number;
	planImageScale: number;
	isActive: boolean;
	isCurrent: boolean;
	hasAssignments: boolean;
};

// Pending floor-plan changes before saving. Not reflected on the server until saved/published.
export type PendingFloorPlan =
	| { action: "upload"; file: File; previewUrl: string; aspectRatio: number }
	| { action: "delete" };

export type AreaData = {
	id: string;
	name: string;
	hasFloorPlan: boolean;
	floorPlanName: string | null;
	planImageUrl: string | null;
	planAspectRatio?: number;
	planImageScale: number;
	planImageOffsetX: number;
	planImageOffsetY: number;
	versions: VersionState[];
};
