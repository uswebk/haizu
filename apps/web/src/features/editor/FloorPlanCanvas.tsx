import type { RefObject } from "react";
import { SpotItem } from "./SpotItem";
import type { SpotState } from "./types";

type Props = {
	hasFloorPlan: boolean;
	floorPlanName: string | null;
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
		e: React.PointerEvent<HTMLDivElement>,
		spotId: string,
	) => void;
	onResizePointerDown: (
		e: React.PointerEvent<HTMLDivElement>,
		spotId: string,
	) => void;
	onZoomChange: (delta: number) => void;
	areaName: string;
	spotCount: number;
};

export function FloorPlanCanvas({
	hasFloorPlan,
	floorPlanName,
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
	return (
		<div className="flex-1 min-w-[480px] p-[18px] bg-app-bg flex flex-col">
			<div className="flex items-center justify-between mb-[10px] shrink-0">
				<div className="text-[13px] font-bold text-ink">
					{areaName}{" "}
					<span className="text-[11.5px] font-semibold text-faint">
						／ {spotCount} 箇所
					</span>
				</div>
				<div className="flex items-center gap-[10px] shrink-0">
					<div className="flex items-center gap-1 border border-border rounded-[8px] bg-surface px-1 py-[2px]">
						<button
							type="button"
							onClick={() => onZoomChange(-0.25)}
							disabled={zoom <= zoomMin}
							className="w-[26px] h-[26px] rounded-[6px] text-[16px] font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
						>
							−
						</button>
						<div className="text-[12px] font-bold text-muted min-w-[42px] text-center tabular-nums">
							{Math.round(zoom * 100)}%
						</div>
						<button
							type="button"
							onClick={() => onZoomChange(0.25)}
							disabled={zoom >= zoomMax}
							className="w-[26px] h-[26px] rounded-[6px] text-[16px] font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
						>
							＋
						</button>
					</div>
					<button
						type="button"
						className="text-[11.5px] font-bold text-primary bg-primary-soft border-none px-3 py-[6px] rounded-[8px] cursor-pointer"
					>
						図面をアップロード
					</button>
				</div>
			</div>

			{hasFloorPlan ? (
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
							onClick={onCanvasClick}
							onPointerMove={onPointerMove}
							onPointerUp={onPointerUp}
							className="relative shrink-0 rounded-[12px] border border-border overflow-hidden select-none shadow-card"
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
							<div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 font-mono text-[10.5px] text-faint pointer-events-none whitespace-nowrap">
								{floorPlanName}
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 rounded-[12px] border-[1.6px] border-dashed border-slot-border bg-empty-bg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors">
					<div className="w-[54px] h-[54px] rounded-[14px] bg-primary-soft flex items-center justify-center">
						<div className="w-[22px] h-[22px] rounded-[5px] border-[2.5px] border-primary" />
					</div>
					<div className="text-[14px] font-bold text-ink">
						このエリアの図面をアップロード
					</div>
					<div className="text-[12px] text-faint">
						PDF / PNG / JPG をドラッグ&ドロップ、またはクリックして選択
					</div>
				</div>
			)}
		</div>
	);
}
