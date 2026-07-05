// 未公開バージョンの effectiveDate プレースホルダー（DBのデフォルト値と合わせる）
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
	effectiveDate: string; // 未公開時は "1000-01-01"
	planImageUrl: string | null;
	planImageName: string | null;
	planAspectRatio?: number;
	planImageScale: number;
	isActive: boolean;
	isCurrent: boolean;
	hasAssignments: boolean;
};

// 図面の保存前の変更内容。保存/公開されるまではサーバーに反映されない。
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
