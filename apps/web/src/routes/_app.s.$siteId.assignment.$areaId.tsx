import type { AssignmentStatus } from "@haizu/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "#/components/ui/Avatar";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { useSnackbar } from "#/contexts/snackbar-context";
import { resolveVersionForDate } from "#/features/assignment/layoutVersion";
import { ShiftDatePicker } from "#/features/assignment/ShiftDatePicker";
import {
	getShiftOptions,
	resolveEffectiveShift,
} from "#/features/assignment/shift";
import type { EmployeeRow } from "#/features/employees/types";
import { useDismiss } from "#/hooks/useDismiss";
import { API_BASE } from "#/lib/api";
import { fetchArea, fetchVersionSpots } from "#/lib/api/areas";
import {
	assignmentKeys,
	fetchAssignments,
	saveAssignment,
} from "#/lib/api/assignments";
import { fetchEmployees } from "#/lib/api/employees";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";
import { todayStr } from "#/lib/datetime";

// エディタと同じ基準幅。規格のアスペクト比で高さを決め、スクロール領域に置く
const BASE_WIDTH = 760;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

export const Route = createFileRoute("/_app/s/$siteId/assignment/$areaId")({
	component: AssignmentDetail,
});

function AssignmentDetail() {
	const { siteId, areaId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const date = search.date ?? todayStr();

	const { data: workPattern } = useQuery({
		queryKey: workPatternKeys.detail,
		queryFn: fetchWorkPattern,
	});
	const { data: area } = useQuery({
		queryKey: ["areas", areaId],
		queryFn: () => fetchArea(areaId),
	});
	const { data: employees = [] } = useQuery({
		queryKey: ["employees"],
		queryFn: fetchEmployees,
	});

	// 配置決めは対象日に適用される公開済み規格を参照する（適用開始日が対象日以前で最新のもの）
	const activeVersion = area
		? resolveVersionForDate(area.versions, date)
		: null;
	const versionId = activeVersion?.id ?? null;
	const isUnpublished = !!area && !activeVersion;

	const { data: spots = [] } = useQuery({
		queryKey: ["areas", areaId, "versions", versionId, "spots"],
		queryFn: () => fetchVersionSpots(areaId, versionId as string),
		enabled: !!versionId,
	});

	const shiftOptions = getShiftOptions(workPattern);
	const effective = resolveEffectiveShift(workPattern, search.shiftId);
	const effectiveShift = workPattern?.shifts.find(
		(s) => s.id === effective.shiftId,
	);

	const { data: assignments = [] } = useQuery({
		queryKey: assignmentKeys.byDateShift(date, effective.shiftId),
		queryFn: () => fetchAssignments({ date, shiftId: effective.shiftId }),
		enabled: !!workPattern,
	});
	const serverAssignment = assignments.find((a) => a.areaId === areaId) ?? null;

	// 下書き state（spotId -> employeeId）
	const [assign, setAssign] = useState<Record<string, string>>({});
	const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
	const [poolSearch, setPoolSearch] = useState("");
	const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
	const [tagMenuOpen, setTagMenuOpen] = useState(false);
	const [tagSearch, setTagSearch] = useState("");
	const [zoom, setZoom] = useState(1);
	const [confirmAction, setConfirmAction] = useState<AssignmentStatus | null>(
		null,
	);
	const dragId = useRef<string | null>(null);
	const tagMenuRef = useRef<HTMLDivElement>(null);
	const closeTagMenu = () => {
		setTagMenuOpen(false);
		setTagSearch("");
	};
	useDismiss(tagMenuOpen, closeTagMenu, tagMenuRef);

	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(
				ZOOM_MAX,
				Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100),
			),
		);

	// biome-ignore lint/correctness/useExhaustiveDependencies: サーバ取得の再構築時のみ下書きを作り直す
	useEffect(() => {
		const next: Record<string, string> = {};
		for (const sa of serverAssignment?.spotAssignments ?? []) {
			next[sa.spotId] = sa.employeeId;
		}
		setAssign(next);
		setSelectedSpot(null);
	}, [serverAssignment, versionId]);

	const empById = useMemo(() => {
		const m = new Map<string, EmployeeRow>();
		for (const e of employees) m.set(e.id, e);
		return m;
	}, [employees]);

	// 従業員が持つタグの一覧（絞り込み用）
	const tagOptions = useMemo(() => {
		const m = new Map<string, string>();
		for (const e of employees) {
			for (const t of e.tags) m.set(t.id, t.name);
		}
		return [...m].map(([id, name]) => ({ id, name }));
	}, [employees]);
	const filteredTagOptions = tagOptions.filter((t) =>
		t.name.includes(tagSearch.trim()),
	);

	const toggleTag = (tagId: string) =>
		setTagFilter((prev) => {
			const next = new Set(prev);
			if (next.has(tagId)) next.delete(tagId);
			else next.add(tagId);
			return next;
		});

	const assignedIds = new Set(Object.values(assign));
	const pool = employees.filter((e) => {
		if (assignedIds.has(e.id)) return false;
		if (tagFilter.size > 0 && !e.tags.some((t) => tagFilter.has(t.id)))
			return false;
		const q = poolSearch.trim();
		if (!q) return true;
		return `${e.lastName}${e.firstName}${e.code}`.includes(q);
	});

	const assignToSpot = (spotId: string, empId: string) => {
		setAssign((prev) => {
			const next = { ...prev };
			let oldSpotId: string | null = null;
			for (const [sid, eid] of Object.entries(next)) {
				if (eid === empId) {
					oldSpotId = sid;
					delete next[sid];
				}
			}
			const bumpedEmpId = next[spotId];
			next[spotId] = empId;
			if (bumpedEmpId && bumpedEmpId !== empId && oldSpotId) {
				next[oldSpotId] = bumpedEmpId;
			}
			return next;
		});
	};
	const unassignSpot = (spotId: string) =>
		setAssign((prev) => {
			const next = { ...prev };
			delete next[spotId];
			return next;
		});
	const unassignEmp = (empId: string) =>
		setAssign((prev) => {
			const next = { ...prev };
			for (const [sid, eid] of Object.entries(next)) {
				if (eid === empId) delete next[sid];
			}
			return next;
		});

	const saveMutation = useMutation({
		mutationFn: (status: AssignmentStatus) => {
			if (!versionId) throw new Error("no active version");
			return saveAssignment({
				areaId,
				layoutSpecVersionId: versionId,
				date,
				shiftId: effective.shiftId,
				status,
				spotAssignments: Object.entries(assign).map(([spotId, employeeId]) => ({
					spotId,
					employeeId,
				})),
			});
		},
		onSuccess: (_data, status) => {
			setConfirmAction(null);
			void queryClient.invalidateQueries({
				queryKey: assignmentKeys.byDateShift(date, effective.shiftId),
			});
			showSuccess(
				status === "confirmed" ? "配置を確定しました" : "下書きを保存しました",
			);
		},
	});

	const setDate = (d: string) =>
		navigate({
			to: "/s/$siteId/assignment/$areaId",
			params: { siteId, areaId },
			search: (prev) => ({ ...prev, date: d }),
		});
	const setShift = (id: string) =>
		navigate({
			to: "/s/$siteId/assignment/$areaId",
			params: { siteId, areaId },
			search: (prev) => ({ ...prev, shiftId: id }),
		});

	const assignedCount = Object.keys(assign).length;
	const totalCount = spots.length;
	const selectedEmpId = selectedSpot ? assign[selectedSpot] : undefined;
	const selectedEmp = selectedEmpId ? empById.get(selectedEmpId) : undefined;
	const selectedSpotObj = spots.find((s) => s.id === selectedSpot) ?? null;

	// 規格のアスペクト比を引き継いだキャンバス（ズームで拡縮）
	const aspect = area?.planAspectRatio ?? 4 / 3;
	const canvasWidth = Math.round(BASE_WIDTH * zoom);
	const canvasHeight = Math.round(canvasWidth / aspect);

	const onDropToPool = (e: React.DragEvent) => {
		e.preventDefault();
		if (dragId.current) unassignEmp(dragId.current);
		dragId.current = null;
	};

	if (workPattern === null) {
		return (
			<div className="p-7 h-full">
				<div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden shadow-card">
					<div className="h-12.5 shrink-0 flex items-center gap-2.5 px-3.5 border-b border-border">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								navigate({
									to: "/s/$siteId/assignment",
									params: { siteId },
									search: (prev) => ({ ...prev, date }),
								})
							}
						>
							← 配置決め一覧
						</Button>
					</div>
					<div className="flex-1 flex flex-col items-center justify-center gap-2.5">
						<div className="text-sm font-bold">
							勤務体制（シフト）が未登録です
						</div>
						<div className="text-xs text-faint">
							先にシフトを登録すると、この画面から配置決めができます
						</div>
						<Link
							to="/s/$siteId/settings/shifts"
							params={{ siteId }}
							className="mt-1 text-[13px] font-bold text-primary hover:text-primary-hover"
						>
							シフトを登録する →
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isUnpublished) {
		return (
			<div className="p-7 h-full">
				<div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden shadow-card">
					<div className="h-12.5 shrink-0 flex items-center gap-2.5 px-3.5 border-b border-border">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								navigate({
									to: "/s/$siteId/assignment",
									params: { siteId },
									search: (prev) => ({ ...prev, date }),
								})
							}
						>
							← 配置決め一覧
						</Button>
						<div className="w-px h-4.5 bg-border" />
						<div className="text-sm font-bold">{area?.name ?? ""}</div>
					</div>
					<div className="flex-1 flex flex-col items-center justify-center gap-2.5">
						<div className="text-sm font-bold">
							この日付に適用される規格がありません
						</div>
						<div className="text-xs text-faint">
							配置エディタで規格を公開し、適用開始日をこの日付以前に設定すると、この画面から配置決めができます
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-7 h-full">
			<div className="flex flex-col h-full min-w-220 bg-surface border border-border rounded-lg overflow-hidden shadow-card">
				{/* toolbar */}
				<div className="h-12.5 shrink-0 flex items-center justify-between px-3.5 border-b border-border gap-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								navigate({
									to: "/s/$siteId/assignment",
									params: { siteId },
									search: (prev) => ({ ...prev, date }),
								})
							}
						>
							← 配置決め一覧
						</Button>
						<div className="w-px h-4.5 bg-border" />
						<div className="text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis">
							{area?.name ?? ""}
						</div>
						{activeVersion && (
							<span className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2.5 py-1 rounded-pill shrink-0">
								規格 {activeVersion.label}（使用中）
							</span>
						)}
						{serverAssignment?.status === "confirmed" && (
							<span className="text-[10.5px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-pill shrink-0">
								確定済み
							</span>
						)}
					</div>
					<div className="flex items-center gap-2.5 shrink-0">
						<ShiftDatePicker
							date={date}
							onDateChange={setDate}
							shiftId={effective.shiftId}
							shiftLabel={effective.label}
							options={shiftOptions}
							onShiftChange={setShift}
						/>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setConfirmAction("draft")}
							disabled={saveMutation.isPending || !versionId}
						>
							{serverAssignment?.status === "confirmed"
								? "下書きに戻す"
								: "下書き保存"}
						</Button>
						<Button
							size="sm"
							onClick={() => setConfirmAction("confirmed")}
							disabled={saveMutation.isPending || !versionId}
						>
							{serverAssignment?.status === "confirmed"
								? "更新する"
								: "確定する"}
						</Button>
					</div>
				</div>

				{/* body */}
				<div className="flex-1 min-h-0 flex">
					{/* left: pool */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: 未配置プールへのドロップ領域 */}
					<div
						onDragOver={(e) => e.preventDefault()}
						onDrop={onDropToPool}
						className="w-53.5 shrink-0 flex flex-col border-r border-border p-3.5"
					>
						<div className="flex items-baseline justify-between mb-2.5">
							<div className="text-[13px] font-bold">未配置の従業員</div>
							<div className="text-[10.5px] font-bold text-warning bg-warning-soft px-2 py-0.75 rounded-pill">
								{pool.length}
							</div>
						</div>
						<input
							value={poolSearch}
							onChange={(e) => setPoolSearch(e.target.value)}
							placeholder="名前で検索"
							className="w-full font-sans text-xs px-2.75 py-2 rounded-sm border border-border bg-surface outline-none"
						/>
						{tagOptions.length > 0 && (
							<div className="relative mt-2" ref={tagMenuRef}>
								<button
									type="button"
									onClick={() => setTagMenuOpen((v) => !v)}
									className="w-full flex items-center justify-between gap-1.5 border border-border rounded-sm px-2.75 py-2 bg-surface text-xs font-bold text-ink cursor-pointer hover:bg-hairline"
								>
									<span>
										タグで絞り込み
										{tagFilter.size > 0 && (
											<span className="text-primary-hover ml-1">
												（{tagFilter.size}）
											</span>
										)}
									</span>
									<span className="text-faint text-[10px]">▾</span>
								</button>
								{tagMenuOpen && (
									<div className="absolute top-9.5 left-0 right-0 bg-surface border border-border rounded-[9px] shadow-float p-1.5 z-30">
										<input
											value={tagSearch}
											onChange={(e) => setTagSearch(e.target.value)}
											placeholder="タグ名で検索"
											className="w-full font-sans text-xs px-2.25 py-1.75 rounded-sm border border-border bg-surface outline-none mb-1.25"
										/>
										<div className="max-h-48 overflow-auto flex flex-col gap-0.5">
											{filteredTagOptions.length === 0 ? (
												<div className="text-[11.5px] text-faint text-center py-2.5">
													該当するタグがありません
												</div>
											) : (
												filteredTagOptions.map((t) => {
													const active = tagFilter.has(t.id);
													return (
														<button
															key={t.id}
															type="button"
															onClick={() => toggleTag(t.id)}
															className="w-full flex items-center gap-2 px-2.25 py-1.75 rounded-sm text-[12.5px] font-semibold text-ink hover:bg-hairline cursor-pointer border-none bg-transparent"
														>
															<span
																className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 text-[10px] ${
																	active
																		? "bg-primary border-primary text-white"
																		: "border-border"
																}`}
															>
																{active && "✓"}
															</span>
															{t.name}
														</button>
													);
												})
											)}
										</div>
									</div>
								)}
							</div>
						)}
						{tagFilter.size > 0 && (
							<div className="flex flex-wrap gap-1 mt-1.5">
								{[...tagFilter].map((id) => {
									const name = tagOptions.find((t) => t.id === id)?.name ?? "";
									return (
										<button
											key={id}
											type="button"
											onClick={() => toggleTag(id)}
											className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2 py-0.75 rounded-pill cursor-pointer border-none"
										>
											{name} ×
										</button>
									);
								})}
							</div>
						)}
						<div className="flex flex-col gap-1.75 mt-2.75 overflow-auto">
							{pool.map((e) => (
								<button
									key={e.id}
									type="button"
									draggable
									onDragStart={() => {
										dragId.current = e.id;
									}}
									onClick={() => {
										if (selectedSpot) assignToSpot(selectedSpot, e.id);
									}}
									className={`flex items-center gap-2.5 p-1.75 rounded-md border text-left ${
										selectedSpot
											? "border-primary-soft-bd bg-primary-soft/40 cursor-pointer"
											: "border-border bg-surface cursor-grab"
									}`}
								>
									<Avatar name={e.lastName} color={e.avatarColor} size={28} />
									<div className="min-w-0">
										<div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
											{e.lastName} {e.firstName}
										</div>
										<div className="text-[11px] text-faint">
											{e.tags[0]?.name ?? ""}
										</div>
									</div>
								</button>
							))}
						</div>
						<div className="mt-2.5 text-[10.5px] text-faint leading-relaxed text-center">
							ここへドラッグで
							<br />
							未配置に戻せます
						</div>
					</div>

					{/* center: plan + spots */}
					<div className="flex-1 min-w-120 p-4.5 bg-app-bg flex flex-col">
						<div className="flex items-center justify-between mb-2.5 shrink-0">
							<div className="text-[13px] font-bold">
								{area?.name ?? ""}{" "}
								<span className="text-[11.5px] font-semibold text-faint">
									／ 配置済み {assignedCount} / {totalCount}
								</span>
							</div>
							{versionId && totalCount > 0 && (
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
						{versionId && totalCount > 0 ? (
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
											aria-label="選択を解除"
											onClick={() => setSelectedSpot(null)}
											className="absolute inset-0 w-full h-full cursor-default border-none bg-transparent p-0"
										/>
										{area?.planImageUrl && (
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
														emp
															? `${emp.lastName} ${emp.firstName}`
															: spot.label
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
									このエリアの規格スポットがありません
								</div>
								<div className="text-xs text-faint">
									配置エディタで図面とスポットを設定してください
								</div>
							</div>
						)}
					</div>

					{/* right: selected spot / summary */}
					<div className="w-59 shrink-0 border-l border-border p-4 flex flex-col gap-4 overflow-auto">
						{selectedSpotObj ? (
							<div>
								<div className="flex items-center justify-between mb-2.5">
									<div className="text-[10.5px] font-bold tracking-widest text-faint">
										スポット {selectedSpotObj.label}
									</div>
									<button
										type="button"
										onClick={() => setSelectedSpot(null)}
										title="選択解除"
										className="w-5.5 h-5.5 rounded-[6px] bg-app-bg text-faint flex items-center justify-center text-sm cursor-pointer"
									>
										×
									</button>
								</div>
								{selectedEmp ? (
									<div className="border border-border rounded-lg p-3.25">
										<div className="flex items-center gap-2.75">
											<Avatar
												name={selectedEmp.lastName}
												color={selectedEmp.avatarColor}
												size={40}
											/>
											<div className="min-w-0">
												<div className="text-[15px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
													{selectedEmp.lastName} {selectedEmp.firstName}
												</div>
												<div className="text-[11.5px] text-faint font-mono">
													{selectedEmp.code}
												</div>
											</div>
										</div>
										{selectedEmp.tags.length > 0 && (
											<div className="flex flex-wrap gap-1.25 mt-3">
												{selectedEmp.tags.map((t) => (
													<Badge key={t.id} tone="primary">
														{t.name}
													</Badge>
												))}
											</div>
										)}
										<Button
											variant="danger"
											size="sm"
											className="w-full mt-3.5"
											onClick={() => unassignSpot(selectedSpotObj.id)}
										>
											配置を解除
										</Button>
									</div>
								) : (
									<div className="border-[1.4px] border-dashed border-primary-soft-bd rounded-lg p-4 text-center bg-primary-soft/30">
										<div className="text-[13px] font-bold text-primary-hover">
											未配置のスポット
										</div>
										<div className="text-[11.5px] text-muted mt-1.5 leading-relaxed">
											左の未配置リストから従業員をタップ、またはドラッグで配置します。
										</div>
									</div>
								)}
							</div>
						) : (
							<>
								<div>
									<div className="text-[10.5px] font-bold tracking-widest text-faint mb-2.25">
										配置状況
									</div>
									<div className="border border-border rounded-lg p-3.25">
										<div className="flex items-baseline gap-1.5">
											<div className="text-[26px] font-bold text-primary">
												{assignedCount}
											</div>
											<div className="text-[13px] font-semibold text-faint">
												/ {totalCount} 名
											</div>
										</div>
										<div className="text-[11.5px] text-faint mt-1">
											{activeVersion ? `規格 ${activeVersion.label} ` : ""}
											のスポット数
										</div>
										{effectiveShift && (
											<div className="text-[11.5px] font-semibold text-primary-hover mt-1">
												{effective.label}（{effectiveShift.startTime}–
												{effectiveShift.endTime}）
											</div>
										)}
									</div>
								</div>
								<div className="text-[11.5px] text-muted leading-relaxed border border-border rounded-lg p-3 bg-table-head">
									スポットをタップすると、配置されている従業員の詳細や解除ができます。割り当てはタップまたはドラッグで行えます。
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			{confirmAction && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">
							{confirmAction === "confirmed" ? "配置を確定" : "下書きを保存"}
						</div>
						<div className="text-[13.5px] text-muted leading-relaxed">
							{confirmAction === "confirmed"
								? "この日・シフトの配置を確定します。確定すると配置ビュアーに表示されます。よろしいですか？"
								: "この日・シフトの配置を下書きとして保存します。（配置ビュアーには表示されません）"}
						</div>
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setConfirmAction(null)}
								disabled={saveMutation.isPending}
							>
								キャンセル
							</Button>
							<Button
								onClick={() => saveMutation.mutate(confirmAction)}
								disabled={saveMutation.isPending}
							>
								{saveMutation.isPending
									? "保存中…"
									: confirmAction === "confirmed"
										? "確定する"
										: "保存する"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
