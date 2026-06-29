import type { AreaData } from "./types";

export const MOCK_AREAS: Record<string, AreaData> = {
	"1": {
		name: "ライン1",
		hasFloorPlan: true,
		floorPlanName: "1F フロア図.png",
		versions: [
			{ id: "v1", label: "v1", isActive: false },
			{ id: "v2", label: "v2", isActive: true },
		],
		initialSpots: [
			{ id: "s1", label: "1", x: 18, y: 28, size: 56 },
			{ id: "s2", label: "2", x: 38, y: 28, size: 56 },
			{ id: "s3", label: "3", x: 60, y: 28, size: 56 },
			{ id: "s4", label: "4", x: 22, y: 68, size: 56 },
			{ id: "s5", label: "5", x: 50, y: 68, size: 56 },
			{ id: "s6", label: "6", x: 76, y: 68, size: 56 },
		],
	},
	"2": {
		name: "ライン2",
		hasFloorPlan: true,
		floorPlanName: "1F フロア図.png",
		versions: [{ id: "v1", label: "v1", isActive: true }],
		initialSpots: [
			{ id: "s1", label: "1", x: 20, y: 30, size: 56 },
			{ id: "s2", label: "2", x: 55, y: 30, size: 56 },
			{ id: "s3", label: "3", x: 25, y: 70, size: 56 },
			{ id: "s4", label: "4", x: 70, y: 70, size: 56 },
		],
	},
	"3": {
		name: "検収室",
		hasFloorPlan: false,
		floorPlanName: null,
		versions: [{ id: "v1", label: "v1", isActive: true }],
		initialSpots: [],
	},
	"4": {
		name: "仕分室",
		hasFloorPlan: false,
		floorPlanName: null,
		versions: [{ id: "v1", label: "v1", isActive: true }],
		initialSpots: [],
	},
};
