import type { AreaData } from "./types";

export const MOCK_AREAS: Record<string, AreaData> = {
	"1": {
		id: "1",
		name: "ライン1",
		hasFloorPlan: true,
		floorPlanName: "1F フロア図.png",
		versions: [
			{ id: "v1", label: "v1", status: "draft", isActive: false, isCurrent: false },
			{ id: "v2", label: "v2", status: "published", isActive: true, isCurrent: true },
		],
	},
	"2": {
		id: "2",
		name: "ライン2",
		hasFloorPlan: true,
		floorPlanName: "1F フロア図.png",
		versions: [{ id: "v1", label: "v1", status: "published", isActive: true, isCurrent: true }],
	},
	"3": {
		id: "3",
		name: "検収室",
		hasFloorPlan: false,
		floorPlanName: null,
		versions: [{ id: "v1", label: "v1", status: "published", isActive: true, isCurrent: true }],
	},
	"4": {
		id: "4",
		name: "仕分室",
		hasFloorPlan: false,
		floorPlanName: null,
		versions: [{ id: "v1", label: "v1", status: "published", isActive: true, isCurrent: true }],
	},
};
