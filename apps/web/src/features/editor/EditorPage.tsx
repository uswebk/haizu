import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as React from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { useSnackbar } from "#/contexts/snackbar-context";
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
import {
	type PendingFloorPlan,
	UNPUBLISHED_EFFECTIVE_DATE,
	type VersionState,
} from "./types";
import { useSpotEditor } from "./useSpotEditor";
import { VersionSelector } from "./VersionSelector";

const BASE_WIDTH = 760;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

type Props = { siteId: string; areaId: string };

export function EditorPage({ siteId, areaId }: Props) {
	const navigate = useNavigate();
	const { t } = useTranslation(["editor", "common"]);
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();

	const { data: areaData } = useQuery({
		queryKey: areaKeys.detail(areaId),
		queryFn: () => fetchArea(areaId),
	});

	const [areaName, setAreaName] = useState<string | null>(null);
	// 選択中バージョンは id のみ保持し、常に areaData（最新の取得結果）から解決する。
	// VersionState のスナップショットを保持すると再取得後も古い状態のまま表示され続けてしまう。
	const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
	const [pendingDuplicate, setPendingDuplicate] = useState<{
		sourceVersionId: string;
		draft: VersionState;
	} | null>(null);
	const [zoom, setZoom] = useState(1);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [publishDialogOpen, setPublishDialogOpen] = useState(false);
	const [deleteAreaDialogOpen, setDeleteAreaDialogOpen] = useState(false);
	const [deleteAreaError, setDeleteAreaError] = useState<string | null>(null);

	const [pendingImage, setPendingImage] = useState<PendingFloorPlan | null>(
		null,
	);

	const resolvedName = areaName ?? areaData?.name ?? "";
	const displayedVersions =
		pendingDuplicate && areaData
			? [...areaData.versions, pendingDuplicate.draft]
			: (areaData?.versions ?? []);
	const resolvedVersion =
		displayedVersions.find((v) => v.id === currentVersionId) ??
		areaData?.versions.find((v) => v.isActive) ??
		areaData?.versions[0] ??
		null;
	const isNewDraft = resolvedVersion?.id === pendingDuplicate?.draft.id;
	const latestVersion =
		areaData?.versions[areaData.versions.length - 1] ?? null;
	const isLatestVersion =
		isNewDraft || resolvedVersion?.id === latestVersion?.id;
	const isLocked = !isNewDraft && (resolvedVersion?.hasAssignments ?? false);
	const canDeleteArea = !areaData?.versions.some((v) => v.hasAssignments);

	const { data: spotsData } = useQuery({
		queryKey: areaKeys.versionSpots(areaId, resolvedVersion?.id ?? ""),
		queryFn: () => fetchVersionSpots(areaId, resolvedVersion?.id ?? ""),
		enabled: !!resolvedVersion && !isNewDraft,
	});

	const savedFloorPlan = {
		hasFloorPlan: !!resolvedVersion?.planImageName,
		floorPlanName: resolvedVersion?.planImageName ?? null,
		imageUrl: resolvedVersion?.planImageUrl
			? `${API_BASE}${resolvedVersion.planImageUrl}`
			: null,
		aspectRatio: resolvedVersion?.planAspectRatio ?? 4 / 3,
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
		isNewDraft ? undefined : resolvedVersion?.planImageScale,
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
				setCurrentVersionId(created.id);
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
			showSuccess(t("editor:draftSaved"));
		},
	});

	const publishMutation = useMutation({
		mutationFn: async (effectiveDate: string) => {
			if (!resolvedVersion || !areaData) throw new Error("no version");
			if (isNewDraft) {
				const created = await materializeDuplicate();
				await persistPendingImage(created.id);
				await publishVersion({
					areaId: areaData.id,
					versionId: created.id,
					effectiveDate,
				});
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
				effectiveDate,
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
			}
			if (versionId) {
				setCurrentVersionId(versionId);
			}
			setPublishDialogOpen(false);
			showSuccess(t("editor:specPublished"));
		},
	});

	const unpublishMutation = useMutation({
		mutationFn: unpublishVersion,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: areaKeys.detail(areaId) });
			showSuccess(t("editor:unpublished"));
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
			effectiveDate: UNPUBLISHED_EFFECTIVE_DATE,
			planImageUrl: resolvedVersion.planImageUrl,
			planImageName: resolvedVersion.planImageName,
			planAspectRatio: resolvedVersion.planAspectRatio,
			planImageScale: resolvedVersion.planImageScale,
			isActive: false,
			isCurrent: false,
			hasAssignments: false,
		};
		setPendingDuplicate({ sourceVersionId: resolvedVersion.id, draft });
		setCurrentVersionId(draft.id);
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
			showSuccess(t("editor:areaDeleted"));
			navigate({ to: "/s/$siteId/editor", params: { siteId } });
		},
		onError: (error) => {
			setDeleteAreaError(
				error instanceof Error ? error.message : t("editor:deleteFailed"),
			);
		},
	});

	if (!areaData || !resolvedVersion) {
		return (
			<div className="p-7 h-full flex items-center justify-center text-faint text-sm">
				{t("common:loading")}
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
							onClick={() =>
								navigate({ to: "/s/$siteId/editor", params: { siteId } })
							}
							className="font-sans text-[12.5px] font-semibold text-muted bg-transparent border-none px-2 py-1.5 rounded-sm cursor-pointer hover:bg-hairline shrink-0"
						>
							{t("editor:backToList")}
						</button>
						<div className="w-px h-4.5 bg-border shrink-0" />
						<div className="text-sm font-bold truncate">{resolvedName}</div>
						<button
							type="button"
							onClick={editor.addSpot}
							disabled={isLocked}
							className="font-sans text-[12.5px] font-bold text-ink bg-surface border border-border px-3 py-1.5 rounded-sm cursor-pointer hover:bg-hairline shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{t("editor:addSpot")}
						</button>
						{isLocked && (
							<span className="text-[11.5px] font-semibold text-warning bg-warning-soft px-2.5 py-1.25 rounded-sm shrink-0">
								{t("editor:lockedEditing")}
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
								setCurrentVersionId(v.id);
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
									{t("editor:saveDraft")}
								</Button>
								<Button
									size="sm"
									onClick={() => setPublishDialogOpen(true)}
									disabled={publishMutation.isPending}
								>
									{t("editor:publishThisSpec")}
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
									{t("common:save")}
								</Button>
								<span className="text-xs font-semibold text-success px-2.5 py-1.5 bg-success/10 rounded-sm">
									{t("editor:publishedDone")}
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
									title={isLocked ? t("editor:cantUnpublishLocked") : undefined}
								>
									{unpublishMutation.isPending
										? t("editor:unpublishing")
										: t("editor:unpublish")}
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
						onDeleteAreaClick={() => {
							setDeleteAreaError(null);
							setDeleteAreaDialogOpen(true);
						}}
						canDeleteArea={canDeleteArea}
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
				onConfirm={(effectiveDate) => publishMutation.mutate(effectiveDate)}
				onCancel={() => setPublishDialogOpen(false)}
			/>

			{deleteAreaDialogOpen && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">
							{t("editor:deleteAreaTitle")}
						</div>
						<div className="text-[13.5px] text-muted">
							{t("editor:deleteAreaConfirm", { name: resolvedName })}
						</div>
						{deleteAreaError && (
							<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-3 leading-relaxed">
								{deleteAreaError}
							</div>
						)}
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setDeleteAreaDialogOpen(false)}
								disabled={deleteAreaMutation.isPending}
							>
								{t("common:cancel")}
							</Button>
							<Button
								onClick={() => deleteAreaMutation.mutate(areaData.id)}
								disabled={deleteAreaMutation.isPending}
							>
								{deleteAreaMutation.isPending
									? t("editor:deleting")
									: t("common:delete")}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
