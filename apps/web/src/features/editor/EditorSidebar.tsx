import { Input } from "#/components/ui/Input";
import type { SpotState } from "./types";

type Props = {
	selectedSpot: SpotState | null;
	areaName: string;
	hasFloorPlan: boolean;
	floorPlanName: string | null;
	imageScale: number;
	spotCount: number;
	readOnly?: boolean;
	onAreaNameChange: (name: string) => void;
	onUpdateSpotLabel: (spotId: string, label: string) => void;
	onUpdateSpotSize: (spotId: string, delta: number) => void;
	onDeleteSpot: (spotId: string) => void;
	onUploadClick: () => void;
	onDeleteImageClick: () => void;
	onImageScaleChange: (scale: number) => void;
	onDeleteAreaClick: () => void;
};

export function EditorSidebar({
	selectedSpot,
	areaName,
	hasFloorPlan,
	floorPlanName,
	imageScale,
	spotCount,
	readOnly = false,
	onAreaNameChange,
	onUpdateSpotLabel,
	onUpdateSpotSize,
	onDeleteSpot,
	onUploadClick,
	onDeleteImageClick,
	onImageScaleChange,
	onDeleteAreaClick,
}: Props) {
	return (
		<div className="w-60 shrink-0 border-l border-border p-4 overflow-auto">
			{selectedSpot ? (
				<>
					<div className="text-[10.5px] font-bold tracking-widest text-faint mb-2.5">
						配置スポットの設定
					</div>
					<Input
						label="ラベル"
						value={selectedSpot.label}
						onChange={(e) => onUpdateSpotLabel(selectedSpot.id, e.target.value)}
						disabled={readOnly}
					/>
					<div className="mt-4">
						<div className="block text-xs font-semibold text-muted mb-1.5">
							大きさ
						</div>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => onUpdateSpotSize(selectedSpot.id, -8)}
								disabled={readOnly}
								className="w-8.5 h-8.5 rounded-sm border border-border flex items-center justify-center text-lg font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
							>
								−
							</button>
							<div className="text-[15px] font-bold min-w-13.5 text-center">
								{Math.round(selectedSpot.size)} px
							</div>
							<button
								type="button"
								onClick={() => onUpdateSpotSize(selectedSpot.id, 8)}
								disabled={readOnly}
								className="w-8.5 h-8.5 rounded-sm border border-border flex items-center justify-center text-lg font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
							>
								＋
							</button>
						</div>
						<div className="text-[11px] text-faint mt-1.75 leading-relaxed">
							スポット右下のハンドルをドラッグでも変更できます
						</div>
					</div>
					<div className="mt-4">
						<div className="block text-xs font-semibold text-muted mb-1.5">
							所属エリア
						</div>
						<div className="text-[13px] font-semibold text-ink border border-border rounded-sm px-2.75 py-2.25 bg-table-head">
							{areaName}
						</div>
					</div>
					<button
						type="button"
						onClick={() => onDeleteSpot(selectedSpot.id)}
						disabled={readOnly}
						className="w-full mt-5 font-sans text-[12.5px] font-semibold px-2.25 py-2.25 rounded-[9px] border border-danger-line bg-surface text-danger cursor-pointer hover:bg-danger-soft disabled:opacity-40 disabled:cursor-not-allowed"
					>
						スポットを削除
					</button>
				</>
			) : (
				<>
					<div className="text-[10.5px] font-bold tracking-widest text-faint mb-2.5">
						エリアの設定
					</div>
					<Input
						label="エリア名"
						value={areaName}
						onChange={(e) => onAreaNameChange(e.target.value)}
					/>
					<div className="mt-4 p-2.75 border border-border rounded-[9px]">
						<div className="text-[10.5px] font-bold tracking-widest text-faint mb-2.5">
							図面
						</div>
						{hasFloorPlan ? (
							<>
								<div className="flex items-center gap-2.25 border border-border rounded-[9px] px-2.75 py-2.25 bg-table-head">
									<div className="w-6.5 h-6.5 rounded-[6px] bg-primary-soft shrink-0" />
									<div className="text-[11.5px] font-semibold text-ink min-w-0 truncate">
										{floorPlanName}
									</div>
								</div>
								<div className="mt-3">
									<div className="block text-xs font-semibold text-muted mb-1.5">
										サイズ
									</div>
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={() => onImageScaleChange(imageScale - 0.1)}
											disabled={readOnly}
											className="w-8.5 h-8.5 rounded-sm border border-border flex items-center justify-center text-lg font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
										>
											−
										</button>
										<div className="text-[15px] font-bold min-w-13.5 text-center tabular-nums">
											{Math.round(imageScale * 100)}%
										</div>
										<button
											type="button"
											onClick={() => onImageScaleChange(imageScale + 0.1)}
											disabled={readOnly}
											className="w-8.5 h-8.5 rounded-sm border border-border flex items-center justify-center text-lg font-bold text-ink cursor-pointer hover:bg-hairline select-none bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
										>
											＋
										</button>
									</div>
								</div>
								<button
									type="button"
									onClick={onUploadClick}
									disabled={readOnly}
									className="w-full mt-3 font-sans text-[12.5px] font-semibold px-2.25 py-2.25 rounded-[9px] border border-border bg-surface text-ink cursor-pointer hover:bg-hairline disabled:opacity-40 disabled:cursor-not-allowed"
								>
									画像を変更
								</button>
								<button
									type="button"
									onClick={onDeleteImageClick}
									disabled={readOnly}
									className="w-full mt-2 font-sans text-[12.5px] font-semibold px-2.25 py-2.25 rounded-[9px] border border-danger-line bg-surface text-danger cursor-pointer hover:bg-danger-soft disabled:opacity-40 disabled:cursor-not-allowed"
								>
									図面を削除
								</button>
							</>
						) : (
							<>
								<div className="text-xs text-faint border-[1.4px] border-dashed border-slot-border rounded-[9px] px-2.75 py-2.75 text-center bg-empty-bg">
									図面が未アップロードです
								</div>
								<button
									type="button"
									onClick={onUploadClick}
									disabled={readOnly}
									className="w-full mt-3 font-sans text-[12.5px] font-semibold px-2.25 py-2.25 rounded-[9px] border-none bg-primary-soft text-primary cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									画像をアップロード
								</button>
							</>
						)}
					</div>
					<div className="mt-3.5 p-2.75 border border-border rounded-[9px] bg-table-head">
						<div className="text-[11px] text-faint">配置スポット</div>
						<div className="text-xl font-bold text-ink mt-0.5">
							{spotCount}{" "}
							<span className="text-xs text-faint font-semibold">箇所</span>
						</div>
					</div>
					<button
						type="button"
						onClick={onDeleteAreaClick}
						className="w-full mt-5 font-sans text-[12.5px] font-semibold px-2.25 py-2.25 rounded-[9px] border border-danger-line bg-surface text-danger cursor-pointer hover:bg-danger-soft"
					>
						エリアを削除
					</button>
				</>
			)}
		</div>
	);
}
