import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { EditorSidebar } from "./EditorSidebar";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { VersionSelector } from "./VersionSelector";
import { MOCK_AREAS } from "./mock";
import type { VersionState } from "./types";
import { useSpotEditor } from "./useSpotEditor";

const BASE_WIDTH = 760;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

type Props = { areaId: string };

export function EditorPage({ areaId }: Props) {
	const navigate = useNavigate();
	const areaData = MOCK_AREAS[areaId] ?? MOCK_AREAS["1"];

	const [areaName, setAreaName] = useState(areaData.name);
	const [currentVersion, setCurrentVersion] = useState<VersionState>(
		areaData.versions.find((v) => v.isActive) ?? areaData.versions[0],
	);
	const [zoom, setZoom] = useState(1);

	const aspectRatio = areaData.planAspectRatio ?? 4 / 3;
	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / aspectRatio);

	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)),
		);

	const editor = useSpotEditor(areaData.initialSpots, zoom);

	return (
		<div className="p-7 h-full flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col bg-surface border border-border rounded-[14px] overflow-hidden shadow-card">
				{/* Toolbar */}
				<div className="h-[50px] shrink-0 flex items-center justify-between px-[14px] border-b border-border">
					<div className="flex items-center gap-[10px] min-w-0">
						<button
							type="button"
							onClick={() => navigate({ to: "/editor" })}
							className="font-sans text-[12.5px] font-semibold text-muted bg-transparent border-none px-2 py-[6px] rounded-[8px] cursor-pointer hover:bg-hairline shrink-0"
						>
							← エリア一覧
						</button>
						<div className="w-px h-[18px] bg-border shrink-0" />
						<div className="text-[14px] font-bold truncate">{areaName}</div>
						<button
							type="button"
							onClick={editor.addSpot}
							className="font-sans text-[12.5px] font-bold text-ink bg-surface border border-border px-3 py-[6px] rounded-[8px] cursor-pointer hover:bg-hairline shrink-0"
						>
							＋ 配置スポット
						</button>
					</div>
					<div className="flex items-center gap-[10px] shrink-0">
						<VersionSelector
							versions={areaData.versions}
							currentVersion={currentVersion}
							onSelect={setCurrentVersion}
						/>
						<Button variant="secondary" size="sm">
							下書き保存
						</Button>
						<Button size="sm">この規格を公開</Button>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 min-h-0 flex">
					<FloorPlanCanvas
						hasFloorPlan={areaData.hasFloorPlan}
						floorPlanName={areaData.floorPlanName}
						canvasWidth={canvasWidth}
						canvasHeight={canvasHeight}
						spots={editor.spots}
						selectedSpotId={editor.selectedSpotId}
						zoom={zoom}
						zoomMin={ZOOM_MIN}
						zoomMax={ZOOM_MAX}
						containerRef={editor.containerRef}
						onCanvasClick={() => editor.setSelectedSpotId(null)}
						onPointerMove={editor.handleContainerPointerMove}
						onPointerUp={editor.handleContainerPointerUp}
						onSpotPointerDown={editor.handleSpotPointerDown}
						onResizePointerDown={editor.handleResizePointerDown}
						onZoomChange={changeZoom}
						areaName={areaName}
						spotCount={editor.spots.length}
					/>
					<EditorSidebar
						selectedSpot={editor.selectedSpot}
						areaName={areaName}
						hasFloorPlan={areaData.hasFloorPlan}
						floorPlanName={areaData.floorPlanName}
						spotCount={editor.spots.length}
						onAreaNameChange={setAreaName}
						onUpdateSpotLabel={editor.updateSpotLabel}
						onUpdateSpotSize={editor.updateSpotSize}
						onDeleteSpot={editor.deleteSpot}
					/>
				</div>
			</div>
		</div>
	);
}
