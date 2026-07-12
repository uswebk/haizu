import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AreaData, SpotState } from "#/features/editor/types";
import type { EmployeeRow } from "#/features/employees/types";
import { API_BASE } from "#/lib/api";

// Same base width as the editor. Height comes from the spec's aspect ratio, placed in a scroll area
const BASE_WIDTH = 760;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

type Props = {
	area: AreaData;
	spots: SpotState[];
	assign: Record<string, string>;
	empById: Map<string, EmployeeRow>;
	selectedSpot: string | null;
	setSelectedSpot: (id: string | null) => void;
	assignToSpot: (spotId: string, empId: string) => void;
	dragId: React.MutableRefObject<string | null>;
	assignedCount: number;
	totalCount: number;
	hasVersion: boolean;
};

export function AssignmentPlanCanvas({
	area,
	spots,
	assign,
	empById,
	selectedSpot,
	setSelectedSpot,
	assignToSpot,
	dragId,
	assignedCount,
	totalCount,
	hasVersion,
}: Props) {
	const { t } = useTranslation(["assignment"]);
	const [zoom, setZoom] = useState(1);
	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(
				ZOOM_MAX,
				Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100),
			),
		);

	const aspect = area.planAspectRatio ?? 4 / 3;
	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / aspect);

	return (
		<div className="flex-1 min-w-120 p-4.5 bg-app-bg flex flex-col">
			<div className="flex items-center justify-between mb-2.5 shrink-0">
				<div className="text-[13px] font-bold">
					{area.name}{" "}
					<span className="text-[11.5px] font-semibold text-faint">
						{t("assignment:detail.placedOf", {
							assigned: assignedCount,
							total: totalCount,
						})}
					</span>
				</div>
				{hasVersion && totalCount > 0 && (
					<div className="flex items-center gap-1 border border-border rounded-sm bg-surface px-1 py-0.5 shrink-0">
						<button
							type="button"
							onClick={() => changeZoom(-0.25)}
							disabled={zoom <= ZOOM_MIN}
							className="w-6.5 h-6.5 rounded-[6px] text-base font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
						>
							−
						</button>
						<div className="text-xs font-bold text-muted min-w-10.5 text-center tabular-nums">
							{Math.round(zoom * 100)}%
						</div>
						<button
							type="button"
							onClick={() => changeZoom(0.25)}
							disabled={zoom >= ZOOM_MAX}
							className="w-6.5 h-6.5 rounded-[6px] text-base font-bold text-ink hover:bg-hairline disabled:text-disabled cursor-pointer disabled:cursor-not-allowed border-none bg-transparent"
						>
							＋
						</button>
					</div>
				)}
			</div>
			{hasVersion && totalCount > 0 ? (
				<div className="flex-1 min-h-0 overflow-auto">
					<div
						className="flex items-center justify-center p-4"
						style={{
							minWidth: `${canvasWidth + 32}px`,
							minHeight: `${canvasHeight + 32}px`,
						}}
					>
						<div
							className="relative shrink-0 rounded-md border border-border overflow-hidden shadow-card"
							style={{
								width: `${canvasWidth}px`,
								height: `${canvasHeight}px`,
								backgroundColor: "#fbfcfe",
								backgroundImage:
									"linear-gradient(#eef2f8 1px, transparent 1px), linear-gradient(90deg, #eef2f8 1px, transparent 1px)",
								backgroundSize: "27px 27px",
							}}
						>
							<button
								type="button"
								aria-label={t("assignment:detail.deselect")}
								onClick={() => setSelectedSpot(null)}
								className="absolute inset-0 w-full h-full cursor-default border-none bg-transparent p-0"
							/>
							{area.planImageUrl && (
								<img
									src={`${API_BASE}${area.planImageUrl}`}
									alt=""
									draggable={false}
									className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
									style={{ transform: `scale(${area.planImageScale})` }}
								/>
							)}
							{spots.map((spot) => {
								const empId = assign[spot.id];
								const emp = empId ? empById.get(empId) : undefined;
								const on = spot.id === selectedSpot;
								const sz = spot.size * zoom;
								return (
									<button
										type="button"
										key={spot.id}
										draggable={!!emp}
										onDragStart={(ev) => {
											if (emp) dragId.current = emp.id;
											ev.stopPropagation();
										}}
										onDragOver={(ev) => ev.preventDefault()}
										onDrop={(ev) => {
											ev.preventDefault();
											ev.stopPropagation();
											if (dragId.current) {
												assignToSpot(spot.id, dragId.current);
												dragId.current = null;
											}
											setSelectedSpot(spot.id);
										}}
										onClick={(ev) => {
											ev.stopPropagation();
											setSelectedSpot(spot.id);
										}}
										title={
											emp ? `${emp.lastName} ${emp.firstName}` : spot.label
										}
										className="absolute flex items-center justify-center rounded-full font-bold select-none cursor-pointer"
										style={{
											left: `${spot.x}%`,
											top: `${spot.y}%`,
											width: `${sz}px`,
											height: `${sz}px`,
											transform: "translate(-50%, -50%)",
											fontSize: `${Math.round(sz * 0.32)}px`,
											background: emp
												? emp.avatarColor
												: on
													? "var(--color-primary-soft)"
													: "rgba(255,255,255,.72)",
											color: emp
												? "#fff"
												: on
													? "var(--color-primary-hover)"
													: "var(--color-faint)",
											border: emp
												? `2px solid ${on ? "#0c8e8d" : "#fff"}`
												: `1.8px dashed ${on ? "#0ea5a4" : "#b3c2d6"}`,
											boxShadow: on
												? "0 0 0 4px rgba(14,165,164,.28)"
												: emp
													? "0 2px 8px rgba(16,42,67,.2)"
													: "none",
										}}
									>
										{emp ? emp.lastName[0] : spot.label}
										{emp && (
											<div
												className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-bold text-ink bg-surface px-1.5 py-px rounded-[6px] shadow-card"
												style={{ top: `${sz + 3}px` }}
											>
												{emp.lastName} {emp.firstName}
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 rounded-md border-[1.6px] border-dashed border-dash bg-empty-bg flex flex-col items-center justify-center gap-2.5">
					<div className="text-sm font-bold">
						{t("assignment:detail.noSpots")}
					</div>
					<div className="text-xs text-faint">
						{t("assignment:detail.noSpotsHint")}
					</div>
				</div>
			)}
		</div>
	);
}
