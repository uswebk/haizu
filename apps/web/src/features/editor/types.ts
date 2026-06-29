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
	isActive: boolean;
};

export type AreaData = {
	name: string;
	hasFloorPlan: boolean;
	floorPlanName: string | null;
	planAspectRatio?: number;
	versions: VersionState[];
	initialSpots: SpotState[];
};
