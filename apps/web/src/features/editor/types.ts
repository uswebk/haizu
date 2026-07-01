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
	isActive: boolean;
	isCurrent: boolean;
};

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
