import type { SpotState } from "#/features/editor/types";
import type { EmployeeRow } from "#/features/employees/types";
import { API_BASE } from "#/lib/api";

// 配置決め詳細と同じ基準幅。規格のアスペクト比で高さを決める
const BASE_WIDTH = 760;

type Props = {
	spots: SpotState[];
	assignBySpot: Map<string, EmployeeRow | undefined>;
	planImageUrl: string | null;
	planImageScale: number;
	aspect: number;
	zoom?: number;
};

// 確定済み配置を読み取り専用で描画する（配置決め詳細のキャンバスから編集操作を除いたもの）
export function PlacementViewCanvas({
	spots,
	assignBySpot,
	planImageUrl,
	planImageScale,
	aspect,
	zoom = 1,
}: Props) {
	if (spots.length === 0) {
		return (
			<div className="flex-1 rounded-md border-[1.6px] border-dashed border-dash bg-empty-bg flex items-center justify-center text-[13px] font-semibold text-faint">
				この記録の図面はありません
			</div>
		);
	}

	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / aspect);

	return (
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
					{planImageUrl && (
						<img
							src={`${API_BASE}${planImageUrl}`}
							alt=""
							draggable={false}
							className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
							style={{ transform: `scale(${planImageScale})` }}
						/>
					)}
					{spots.map((spot) => {
						const emp = assignBySpot.get(spot.id);
						const sz = spot.size * zoom;
						return (
							<div
								key={spot.id}
								title={emp ? `${emp.lastName} ${emp.firstName}` : spot.label}
								className="absolute flex items-center justify-center rounded-full font-bold select-none"
								style={{
									left: `${spot.x}%`,
									top: `${spot.y}%`,
									width: `${sz}px`,
									height: `${sz}px`,
									transform: "translate(-50%, -50%)",
									fontSize: `${Math.round(sz * 0.32)}px`,
									background: emp ? emp.avatarColor : "rgba(255,255,255,.72)",
									color: emp ? "#fff" : "var(--color-faint)",
									border: emp ? "2px solid #fff" : "1.8px dashed #b3c2d6",
									boxShadow: emp ? "0 2px 8px rgba(16,42,67,.2)" : "none",
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
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
