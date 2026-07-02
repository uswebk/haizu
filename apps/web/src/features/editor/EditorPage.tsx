import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as React from "react";
import { useRef, useState } from "react";
import { Button } from "#/components/ui/Button";
import { API_BASE } from "#/lib/api";
import {
	areaKeys,
	deleteFloorPlan,
	duplicateVersion,
	fetchArea,
	fetchVersionSpots,
	publishVersion,
	saveAreaDraft,
	unpublishVersion,
	uploadFloorPlan,
} from "#/lib/api/areas";
import { EditorSidebar } from "./EditorSidebar";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { SaveDraftDialog } from "./SaveDraftDialog";
import type { VersionState } from "./types";
import { useSpotEditor } from "./useSpotEditor";
import { VersionSelector } from "./VersionSelector";

const BASE_WIDTH = 760;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

type Props = { areaId: string };

export function EditorPage({ areaId }: Props) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: areaData } = useQuery({
		queryKey: areaKeys.detail(areaId),
		queryFn: () => fetchArea(areaId),
	});

	const [areaName, setAreaName] = useState<string | null>(null);
	const [currentVersion, setCurrentVersion] = useState<VersionState | null>(
		null,
	);
	const [pendingDuplicate, setPendingDuplicate] = useState<{
		sourceVersionId: string;
		draft: VersionState;
	} | null>(null);
	const [zoom, setZoom] = useState(1);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);

	const resolvedName = areaName ?? areaData?.name ?? "";
	const resolvedVersion =
		currentVersion ??
		areaData?.versions.find((v) => v.isActive) ??
		areaData?.versions[0] ??
		null;
	const isNewDraft = resolvedVersion?.id === pendingDuplicate?.draft.id;
	const displayedVersions =
		pendingDuplicate && areaData
			? [...areaData.versions, pendingDuplicate.draft]
			: (areaData?.versions ?? []);

	const { data: spotsData } = useQuery({
		queryKey: areaKeys.versionSpots(areaId, resolvedVersion?.id ?? ""),
		queryFn: () => fetchVersionSpots(areaId, resolvedVersion?.id ?? ""),
		enabled: !!resolvedVersion && !isNewDraft,
	});

	const aspectRatio = areaData?.planAspectRatio ?? 4 / 3;
	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / aspectRatio);

	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(
				ZOOM_MAX,
				Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100),
			),
		);

	const editor = useSpotEditor(
		spotsData,
		resolvedVersion?.id,
		zoom,
		isNewDraft ? undefined : areaData?.planImageScale,
	);

	const materializeDuplicate = async () => {
		if (!pendingDuplicate || !areaData) throw new Error("no pending duplicate");
		return await duplicateVersion({
			areaId: areaData.id,
			versionId: pendingDuplicate.sourceVersionId,
			spots: editor.spots.map(({ label, x, y, size }) => ({
				label,
				x,
				y,
				size,
			})),
			imageScale: editor.imageScale,
		});
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!resolvedVersion) return;
			if (isNewDraft) {
				return materializeDuplicate();
			}
			await saveAreaDraft({
				areaId,
				versionId: resolvedVersion.id,
				spots: editor.spots,
				imageScale: editor.imageScale,
			});
			return null;
		},
		onSuccess: (created) => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
			if (created) {
				setPendingDuplicate(null);
				setCurrentVersion({
					id: created.id,
					label: created.label,
					status: "draft",
					isActive: false,
					isCurrent: false,
				});
				void queryClient.invalidateQueries({
					queryKey: areaKeys.versionSpots(areaId, created.id),
				});
			} else {
				void queryClient.invalidateQueries({
					queryKey: areaKeys.versionSpots(areaId, resolvedVersion?.id ?? ""),
				});
			}
			setSaveDialogOpen(false);
		},
	});

	const publishMutation = useMutation({
		mutationFn: async () => {
			if (!resolvedVersion || !areaData) throw new Error("no version");
			if (isNewDraft) {
				const created = await materializeDuplicate();
				await publishVersion({ areaId: areaData.id, versionId: created.id });
				return created.id;
			}
			await saveAreaDraft({
				areaId: areaData.id,
				versionId: resolvedVersion.id,
				spots: editor.spots,
				imageScale: editor.imageScale,
			});
			await publishVersion({
				areaId: areaData.id,
				versionId: resolvedVersion.id,
			});
			return resolvedVersion.id;
		},
		onSuccess: (versionId) => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
			void queryClient.invalidateQueries({
				queryKey: areaKeys.versionSpots(areaId, versionId),
			});
			if (isNewDraft) {
				setPendingDuplicate(null);
				setCurrentVersion(null);
			}
		},
	});

	const unpublishMutation = useMutation({
		mutationFn: unpublishVersion,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
		},
	});

	const handleDuplicate = () => {
		if (!resolvedVersion || !areaData) return;
		const versionNumbers = areaData.versions
			.map((v) => Number.parseInt(v.label.replace(/^v/, ""), 10))
			.filter((n) => !Number.isNaN(n));
		const nextVersion =
			(versionNumbers.length ? Math.max(...versionNumbers) : 0) + 1;
		const draft: VersionState = {
			id: `pending-${Date.now()}`,
			label: `v${nextVersion}`,
			status: "draft",
			isActive: false,
			isCurrent: false,
		};
		setPendingDuplicate({ sourceVersionId: resolvedVersion.id, draft });
		setCurrentVersion(draft);
	};

	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadMutation = useMutation({
		mutationFn: uploadFloorPlan,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
		},
	});

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file || !resolvedVersion || isNewDraft) return;
		uploadMutation.mutate({ areaId, versionId: resolvedVersion.id, file });
	};

	const deleteFloorPlanMutation = useMutation({
		mutationFn: deleteFloorPlan,
		onSuccess: () => {
			editor.resetImageScale();
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
		},
	});

	if (!areaData || !resolvedVersion) {
		return (
			<div className="p-7 h-full flex items-center justify-center text-faint text-sm">
				読み込み中…
			</div>
		);
	}

	return (
		<div className="p-7 h-full flex flex-col">
			<div className="flex-1 min-h-0 flex flex-col bg-surface border border-border rounded-lg overflow-hidden shadow-card">
				{/* Toolbar */}
				<div className="h-12.5 shrink-0 flex items-center justify-between px-3.5 border-b border-border">
					<div className="flex items-center gap-2.5 min-w-0">
						<button
							type="button"
							onClick={() => navigate({ to: "/editor" })}
							className="font-sans text-[12.5px] font-semibold text-muted bg-transparent border-none px-2 py-1.5 rounded-sm cursor-pointer hover:bg-hairline shrink-0"
						>
							← エリア一覧
						</button>
						<div className="w-px h-4.5 bg-border shrink-0" />
						<div className="text-sm font-bold truncate">{resolvedName}</div>
						<button
							type="button"
							onClick={editor.addSpot}
							className="font-sans text-[12.5px] font-bold text-ink bg-surface border border-border px-3 py-1.5 rounded-sm cursor-pointer hover:bg-hairline shrink-0"
						>
							＋ 配置スポット
						</button>
					</div>
					<div className="flex items-center gap-2.5 shrink-0">
						<VersionSelector
							versions={displayedVersions}
							currentVersion={resolvedVersion}
							onSelect={(v) => {
								if (v.id !== pendingDuplicate?.draft.id) {
									setPendingDuplicate(null);
								}
								setCurrentVersion(v);
							}}
							onDuplicate={handleDuplicate}
						/>
						{resolvedVersion.status === "draft" ? (
							<>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setSaveDialogOpen(true)}
								>
									下書き保存
								</Button>
								<Button
									size="sm"
									onClick={() => publishMutation.mutate()}
									disabled={publishMutation.isPending}
								>
									{publishMutation.isPending ? "公開中…" : "この規格を公開"}
								</Button>
							</>
						) : (
							<>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setSaveDialogOpen(true)}
								>
									保存
								</Button>
								<span className="text-xs font-semibold text-success px-2.5 py-1.5 bg-success/10 rounded-sm">
									公開済み
								</span>
								<Button
									variant="secondary"
									size="sm"
									onClick={() =>
										unpublishMutation.mutate({
											areaId: areaData.id,
											versionId: resolvedVersion.id,
										})
									}
									disabled={unpublishMutation.isPending}
								>
									{unpublishMutation.isPending
										? "取り消し中…"
										: "公開を取り消す"}
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="flex-1 min-h-0 flex">
					<FloorPlanCanvas
						hasFloorPlan={areaData.hasFloorPlan}
						floorPlanName={areaData.floorPlanName}
						floorPlanImageUrl={
							areaData.planImageUrl
								? `${API_BASE}${areaData.planImageUrl}`
								: null
						}
						imageScale={editor.imageScale}
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
						areaName={resolvedName}
						spotCount={editor.spots.length}
					/>
					<EditorSidebar
						selectedSpot={editor.selectedSpot}
						areaName={resolvedName}
						hasFloorPlan={areaData.hasFloorPlan}
						floorPlanName={areaData.floorPlanName}
						imageScale={editor.imageScale}
						spotCount={editor.spots.length}
						onAreaNameChange={setAreaName}
						onUpdateSpotLabel={editor.updateSpotLabel}
						onUpdateSpotSize={editor.updateSpotSize}
						onDeleteSpot={editor.deleteSpot}
						onUploadClick={() => !isNewDraft && fileInputRef.current?.click()}
						onDeleteImageClick={() =>
							!isNewDraft &&
							deleteFloorPlanMutation.mutate({
								areaId,
								versionId: resolvedVersion.id,
							})
						}
						onImageScaleChange={editor.setImageScale}
					/>
				</div>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/png,image/jpeg"
				className="hidden"
				onChange={handleFileSelected}
			/>

			<SaveDraftDialog
				open={saveDialogOpen}
				isPending={saveMutation.isPending}
				status={resolvedVersion.status}
				onConfirm={() => saveMutation.mutate()}
				onCancel={() => setSaveDialogOpen(false)}
			/>
		</div>
	);
}
