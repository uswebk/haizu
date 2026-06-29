import { Input } from "#/components/ui/Input";
import type { SpotState } from "./types";

type Props = {
	selectedSpot: SpotState | null;
	areaName: string;
	hasFloorPlan: boolean;
	floorPlanName: string | null;
	spotCount: number;
	onAreaNameChange: (name: string) => void;
	onUpdateSpotLabel: (spotId: string, label: string) => void;
	onUpdateSpotSize: (spotId: string, delta: number) => void;
	onDeleteSpot: (spotId: string) => void;
};

export function EditorSidebar({
	selectedSpot,
	areaName,
	hasFloorPlan,
	floorPlanName,
	spotCount,
	onAreaNameChange,
	onUpdateSpotLabel,
	onUpdateSpotSize,
	onDeleteSpot,
}: Props) {
	return (
		<div className="w-[240px] shrink-0 border-l border-border p-[16px] overflow-auto">
			{selectedSpot ? (
				<>
					<div className="text-[10.5px] font-bold tracking-[.1em] text-faint mb-[10px]">
						配置スポットの設定
					</div>
					<Input
						label="ラベル"
						value={selectedSpot.label}
						onChange={(e) => onUpdateSpotLabel(selectedSpot.id, e.target.value)}
					/>
					<div className="mt-4">
						<label className="block text-[12px] font-semibold text-muted mb-[6px]">
							大きさ
						</label>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => onUpdateSpotSize(selectedSpot.id, -8)}
								className="w-[34px] h-[34px] rounded-[8px] border border-border flex items-center justify-center text-[18px] font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface"
							>
								−
							</button>
							<div className="text-[15px] font-bold min-w-[54px] text-center">
								{Math.round(selectedSpot.size)} px
							</div>
							<button
								type="button"
								onClick={() => onUpdateSpotSize(selectedSpot.id, 8)}
								className="w-[34px] h-[34px] rounded-[8px] border border-border flex items-center justify-center text-[18px] font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface"
							>
								＋
							</button>
						</div>
						<div className="text-[11px] text-faint mt-[7px] leading-relaxed">
							スポット右下のハンドルをドラッグでも変更できます
						</div>
					</div>
					<div className="mt-4">
						<label className="block text-[12px] font-semibold text-muted mb-[6px]">
							所属エリア
						</label>
						<div className="text-[13px] font-semibold text-ink border border-border rounded-[8px] px-[11px] py-[9px] bg-table-head">
							{areaName}
						</div>
					</div>
					<button
						type="button"
						onClick={() => onDeleteSpot(selectedSpot.id)}
						className="w-full mt-5 font-sans text-[12.5px] font-semibold px-[9px] py-[9px] rounded-[9px] border border-danger-line bg-surface text-danger cursor-pointer hover:bg-danger-soft"
					>
						スポットを削除
					</button>
				</>
			) : (
				<>
					<div className="text-[10.5px] font-bold tracking-[.1em] text-faint mb-[10px]">
						エリアの設定
					</div>
					<Input
						label="エリア名"
						value={areaName}
						onChange={(e) => onAreaNameChange(e.target.value)}
					/>
					<div className="mt-4">
						<label className="block text-[12px] font-semibold text-muted mb-[6px]">
							図面
						</label>
						{hasFloorPlan ? (
							<div className="flex items-center gap-[9px] border border-border rounded-[9px] px-[11px] py-[9px]">
								<div className="w-[26px] h-[26px] rounded-[6px] bg-primary-soft shrink-0" />
								<div className="text-[11.5px] font-semibold text-ink min-w-0 truncate">
									{floorPlanName}
								</div>
							</div>
						) : (
							<div className="text-[12px] text-faint border-[1.4px] border-dashed border-slot-border rounded-[9px] px-[11px] py-[11px] text-center bg-empty-bg">
								図面が未アップロードです
							</div>
						)}
					</div>
					<div className="mt-[14px] p-[11px] border border-border rounded-[9px] bg-table-head">
						<div className="text-[11px] text-faint">配置スポット</div>
						<div className="text-[20px] font-bold text-ink mt-[2px]">
							{spotCount}{" "}
							<span className="text-[12px] text-faint font-semibold">箇所</span>
						</div>
					</div>
					<button
						type="button"
						className="w-full mt-5 font-sans text-[12.5px] font-semibold px-[9px] py-[9px] rounded-[9px] border border-danger-line bg-surface text-danger cursor-pointer hover:bg-danger-soft"
					>
						エリアを削除
					</button>
				</>
			)}
		</div>
	);
}
