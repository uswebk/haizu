import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { SpotItem } from "./SpotItem";
import type { SpotState } from "./types";

type Props = {
	hasFloorPlan: boolean;
	floorPlanName: string | null;
	floorPlanImageUrl: string | null;
	imageScale: number;
	canvasWidth: number;
	canvasHeight: number;
	spots: SpotState[];
	selectedSpotId: string | null;
	zoom: number;
	zoomMin: number;
	zoomMax: number;
	containerRef: RefObject<HTMLDivElement | null>;
	onCanvasClick: () => void;
	onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
	onPointerUp: () => void;
	onSpotPointerDown: (
		e: React.PointerEvent<HTMLElement>,
		spotId: string,
	) => void;
	onResizePointerDown: (
		e: React.PointerEvent<HTMLElement>,
		spotId: string,
	) => void;
	onZoomChange: (delta: number) => void;
	areaName: string;
	spotCount: number;
};

export function FloorPlanCanvas({
	hasFloorPlan,
	floorPlanName,
	floorPlanImageUrl,
	imageScale,
	canvasWidth,
	canvasHeight,
	spots,
	selectedSpotId,
	zoom,
	zoomMin,
	zoomMax,
	containerRef,
	onCanvasClick,
	onPointerMove,
	onPointerUp,
	onSpotPointerDown,
	onResizePointerDown,
	onZoomChange,
	areaName,
	spotCount,
}: Props) {
	const { t } = useTranslation("editor");
	return (
		<div className="flex-1 min-w-120 p-4.5 bg-app-bg flex flex-col">
			<div className="flex items-center justify-between mb-2.5 shrink-0">
				<div className="text-[13px] font-bold text-ink">
					{areaName}{" "}
					<span className="text-[11.5px] font-semibold text-faint">
						{t("editor:planSpotCount", { count: spotCount })}
					</span>
				</div>
				<div className="flex items-center gap-1 border border-border rounded-sm bg-surface px-1 py-0.5 shrink-0">
					<button
						type="button"
						onClick={() => onZoomChange(-0.25)}
						disabled={zoom <= zoomMin}
						className="w-6.5 h-6.5 rounded-[6px] text-base font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
					>
						−
					</button>
					<div className="text-xs font-bold text-muted min-w-10.5 text-center tabular-nums">
						{Math.round(zoom * 100)}%
					</div>
					<button
						type="button"
						onClick={() => onZoomChange(0.25)}
						disabled={zoom >= zoomMax}
						className="w-6.5 h-6.5 rounded-[6px] text-base font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
					>
						＋
					</button>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-auto">
				<div
					style={{
						minWidth: `${canvasWidth + 32}px`,
						minHeight: `${canvasHeight + 32}px`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "16px",
					}}
				>
					<div
						ref={containerRef}
						onPointerDown={(e) => {
							if (e.target === e.currentTarget) onCanvasClick();
						}}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						className="relative shrink-0 rounded-md border border-border overflow-hidden select-none shadow-card"
						style={{
							width: `${canvasWidth}px`,
							height: `${canvasHeight}px`,
							backgroundColor: "#fbfcfe",
							backgroundImage:
								"linear-gradient(#eef2f8 1px, transparent 1px), linear-gradient(90deg, #eef2f8 1px, transparent 1px)",
							backgroundSize: "27px 27px",
							cursor: "default",
						}}
					>
						{floorPlanImageUrl && (
							<img
								src={floorPlanImageUrl}
								alt=""
								draggable={false}
								className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
								style={{ transform: `scale(${imageScale})` }}
							/>
						)}
						{spots.map((spot) => (
							<SpotItem
								key={spot.id}
								spot={spot}
								isSelected={spot.id === selectedSpotId}
								zoom={zoom}
								onPointerDown={onSpotPointerDown}
								onResizePointerDown={onResizePointerDown}
							/>
						))}
						{hasFloorPlan ? (
							<div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 font-mono text-[10.5px] text-faint pointer-events-none whitespace-nowrap">
								{floorPlanName}
							</div>
						) : (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
								<div className="text-xs font-bold text-faint">
									{t("editor:planNotSet")}
								</div>
								<div className="text-[11px] text-faint">
									{t("editor:planOptional")}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
