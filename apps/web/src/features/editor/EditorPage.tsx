import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as React from "react";
import { useRef, useState } from "react";
import { Button } from "#/components/ui/Button";
import { API_BASE } from "#/lib/api";
import {
	areaKeys,
	deleteArea,
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
import { PublishDialog } from "./PublishDialog";
import { SaveDraftDialog } from "./SaveDraftDialog";
import type { PendingFloorPlan, VersionState } from "./types";
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
	const [publishDialogOpen, setPublishDialogOpen] = useState(false);
	const [deleteAreaDialogOpen, setDeleteAreaDialogOpen] = useState(false);

	const [pendingImage, setPendingImage] = useState<PendingFloorPlan | null>(
		null,
	);

	const resolvedName = areaName ?? areaData?.name ?? "";
	const resolvedVersion =
		currentVersion ??
		areaData?.versions.find((v) => v.isActive) ??
		areaData?.versions[0] ??
		null;
	const isNewDraft = resolvedVersion?.id === pendingDuplicate?.draft.id;
	const latestVersion =
		areaData?.versions[areaData.versions.length - 1] ?? null;
	const isLatestVersion =
		isNewDraft || resolvedVersion?.id === latestVersion?.id;
	const isLocked = !isNewDraft && (resolvedVersion?.hasAssignments ?? false);
	const displayedVersions =
		pendingDuplicate && areaData
			? [...areaData.versions, pendingDuplicate.draft]
			: (areaData?.versions ?? []);

	const { data: spotsData } = useQuery({
		queryKey: areaKeys.versionSpots(areaId, resolvedVersion?.id ?? ""),
		queryFn: () => fetchVersionSpots(areaId, resolvedVersion?.id ?? ""),
		enabled: !!resolvedVersion && !isNewDraft,
	});

	const savedFloorPlan = {
		hasFloorPlan: areaData?.hasFloorPlan ?? false,
		floorPlanName: areaData?.floorPlanName ?? null,
		imageUrl: areaData?.planImageUrl
			? `${API_BASE}${areaData.planImageUrl}`
			: null,
		aspectRatio: areaData?.planAspectRatio ?? 4 / 3,
	};
	const displayedFloorPlan =
		pendingImage?.action === "delete"
			? {
					...savedFloorPlan,
					hasFloorPlan: false,
					floorPlanName: null,
					imageUrl: null,
				}
			: pendingImage?.action === "upload"
				? {
						hasFloorPlan: true,
						floorPlanName: pendingImage.file.name,
						imageUrl: pendingImage.previewUrl,
						aspectRatio: pendingImage.aspectRatio,
					}
				: savedFloorPlan;

	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / displayedFloorPlan.aspectRatio);

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

	const persistPendingImage = async (versionId: string) => {
		if (!pendingImage) return;
		if (pendingImage.action === "delete") {
			await deleteFloorPlan({ areaId, versionId });
		} else {
			await uploadFloorPlan({ areaId, versionId, file: pendingImage.file });
		}
	};

	const clearPendingImage = () => {
		if (pendingImage?.action === "upload") {
			URL.revokeObjectURL(pendingImage.previewUrl);
		}
		setPendingImage(null);
	};

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
				const created = await materializeDuplicate();
				await persistPendingImage(created.id);
				return created;
			}
			await saveAreaDraft({
				areaId,
				versionId: resolvedVersion.id,
				spots: editor.spots,
				imageScale: editor.imageScale,
			});
			await persistPendingImage(resolvedVersion.id);
			return null;
		},
		onSuccess: (created) => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
			clearPendingImage();
			if (created) {
				setPendingDuplicate(null);
				setCurrentVersion({
					id: created.id,
					label: created.label,
					status: "draft",
					isActive: false,
					isCurrent: false,
					hasAssignments: false,
				});
				queryClient.setQueryData(
					areaKeys.versionSpots(areaId, created.id),
					editor.spots,
				);
			} else {
				queryClient.setQueryData(
					areaKeys.versionSpots(areaId, resolvedVersion?.id ?? ""),
					editor.spots,
				);
			}
			setSaveDialogOpen(false);
		},
	});

	const publishMutation = useMutation({
		mutationFn: async () => {
			if (!resolvedVersion || !areaData) throw new Error("no version");
			if (isNewDraft) {
				const created = await materializeDuplicate();
				await persistPendingImage(created.id);
				await publishVersion({ areaId: areaData.id, versionId: created.id });
				return created.id;
			}
			await saveAreaDraft({
				areaId: areaData.id,
				versionId: resolvedVersion.id,
				spots: editor.spots,
				imageScale: editor.imageScale,
			});
			await persistPendingImage(resolvedVersion.id);
			await publishVersion({
				areaId: areaData.id,
				versionId: resolvedVersion.id,
			});
			return resolvedVersion.id;
		},
		onSuccess: (versionId) => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
			if (versionId) {
				queryClient.setQueryData(
					areaKeys.versionSpots(areaId, versionId),
					editor.spots,
				);
			}
			clearPendingImage();
			if (isNewDraft) {
				setPendingDuplicate(null);
				setCurrentVersion(null);
			}
			setPublishDialogOpen(false);
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
			hasAssignments: false,
		};
		setPendingDuplicate({ sourceVersionId: resolvedVersion.id, draft });
		setCurrentVersion(draft);
	};

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file || !resolvedVersion) return;
		if (pendingImage?.action === "upload") {
			URL.revokeObjectURL(pendingImage.previewUrl);
		}
		const previewUrl = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			setPendingImage({
				action: "upload",
				file,
				previewUrl,
				aspectRatio: img.naturalWidth / img.naturalHeight,
			});
		};
		img.src = previewUrl;
		editor.setImageScale(1);
	};

	const handleDeleteImageClick = () => {
		if (!resolvedVersion || !displayedFloorPlan.hasFloorPlan) return;
		if (pendingImage?.action === "upload") {
			URL.revokeObjectURL(pendingImage.previewUrl);
		}
		setPendingImage({ action: "delete" });
		editor.resetImageScale();
	};

	const deleteAreaMutation = useMutation({
		mutationFn: deleteArea,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.all });
			navigate({ to: "/editor" });
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
							disabled={isLocked}
							className="font-sans text-[12.5px] font-bold text-ink bg-surface border border-border px-3 py-1.5 rounded-sm cursor-pointer hover:bg-hairline shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							＋ 配置スポット
						</button>
						{isLocked && (
							<span className="text-[11.5px] font-semibold text-warning bg-warning-soft px-2.5 py-1.25 rounded-sm shrink-0">
								配置決めで使用中のため編集できません
							</span>
						)}
					</div>
					<div className="flex items-center gap-2.5 shrink-0">
						<VersionSelector
							versions={displayedVersions}
							currentVersion={resolvedVersion}
							onSelect={(v) => {
								if (v.id !== pendingDuplicate?.draft.id) {
									setPendingDuplicate(null);
								}
								clearPendingImage();
								setCurrentVersion(v);
							}}
							onDuplicate={() => {
								clearPendingImage();
								handleDuplicate();
							}}
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
									onClick={() => setPublishDialogOpen(true)}
									disabled={publishMutation.isPending}
								>
									この規格を公開
								</Button>
							</>
						) : (
							<>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setSaveDialogOpen(true)}
									disabled={isLocked}
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
									disabled={unpublishMutation.isPending || isLocked}
									title={
										isLocked
											? "配置決めで使用されているため取り消せません"
											: undefined
									}
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
						hasFloorPlan={displayedFloorPlan.hasFloorPlan}
						floorPlanName={displayedFloorPlan.floorPlanName}
						floorPlanImageUrl={displayedFloorPlan.imageUrl}
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
						onSpotPointerDown={
							isLocked ? () => {} : editor.handleSpotPointerDown
						}
						onResizePointerDown={
							isLocked ? () => {} : editor.handleResizePointerDown
						}
						onZoomChange={changeZoom}
						areaName={resolvedName}
						spotCount={editor.spots.length}
					/>
					<EditorSidebar
						selectedSpot={editor.selectedSpot}
						areaName={resolvedName}
						hasFloorPlan={displayedFloorPlan.hasFloorPlan}
						floorPlanName={displayedFloorPlan.floorPlanName}
						imageScale={editor.imageScale}
						spotCount={editor.spots.length}
						readOnly={isLocked}
						onAreaNameChange={setAreaName}
						onUpdateSpotLabel={editor.updateSpotLabel}
						onUpdateSpotSize={editor.updateSpotSize}
						onDeleteSpot={editor.deleteSpot}
						onUploadClick={() => fileInputRef.current?.click()}
						onDeleteImageClick={handleDeleteImageClick}
						onImageScaleChange={editor.setImageScale}
						onDeleteAreaClick={() => setDeleteAreaDialogOpen(true)}
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

			<PublishDialog
				open={publishDialogOpen}
				isPending={publishMutation.isPending}
				versionLabel={resolvedVersion.label}
				isLatest={isLatestVersion}
				onConfirm={() => publishMutation.mutate()}
				onCancel={() => setPublishDialogOpen(false)}
			/>

			{deleteAreaDialogOpen && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">エリアを削除</div>
						<div className="text-[13.5px] text-muted">
							「{resolvedName}
							」を削除します。図面・配置スポットもすべて削除され、元に戻せません。
						</div>
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setDeleteAreaDialogOpen(false)}
								disabled={deleteAreaMutation.isPending}
							>
								キャンセル
							</Button>
							<Button
								onClick={() => deleteAreaMutation.mutate(areaData.id)}
								disabled={deleteAreaMutation.isPending}
							>
								{deleteAreaMutation.isPending ? "削除中…" : "削除する"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
