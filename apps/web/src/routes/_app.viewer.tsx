import type { ViewerConfig } from "@haiz/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "#/components/ui/Avatar";
import { PlacementViewCanvas } from "#/features/assignment/PlacementViewCanvas";
import type { EmployeeRow } from "#/features/employees/types";
import { resolveViewerDisplay } from "#/features/viewer/resolveViewerDisplay";
import type { AreaListItem } from "#/lib/api/areas";
import {
	areaKeys,
	fetchArea,
	fetchAreas,
	fetchVersionSpots,
} from "#/lib/api/areas";
import { assignmentKeys, fetchAssignments } from "#/lib/api/assignments";
import { fetchEmployees } from "#/lib/api/employees";
import { fetchViewerConfigs, viewerConfigKeys } from "#/lib/api/viewer";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";
import { formatClock, formatDateLabel, toDateStr } from "#/lib/datetime";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 6;
// PlacementViewCanvas の基準幅。フィット計算に使う
const BASE_WIDTH = 760;
// ボード周囲の余白（PlacementViewCanvas の内側 p-4＋見切れ防止マージン）
const BOARD_PADDING = 56;

type ViewerSearch = { area?: string };

export const Route = createFileRoute("/_app/viewer")({
	validateSearch: (search): ViewerSearch => ({
		area: typeof search.area === "string" ? search.area : undefined,
	}),
	component: Viewer,
});

function defaultConfig(areaId: string): ViewerConfig {
	return {
		areaId,
		mode: "auto",
		displayDate: null,
		shiftId: null,
		shiftName: null,
		shiftStartTime: null,
		shiftEndTime: null,
		leadMinutes: 0,
	};
}

function useCommonData() {
	const { data: configs = [] } = useQuery({
		queryKey: viewerConfigKeys.all,
		queryFn: fetchViewerConfigs,
	});
	const { data: workPattern } = useQuery({
		queryKey: workPatternKeys.detail,
		queryFn: fetchWorkPattern,
	});
	const configByArea = useMemo(
		() => new Map(configs.map((c) => [c.areaId, c])),
		[configs],
	);
	return { configByArea, workPattern };
}

function Viewer() {
	const search = Route.useSearch();
	return search.area ? <ViewerDetail areaId={search.area} /> : <ViewerList />;
}

function ViewerList() {
	const { data: areas = [] } = useQuery({
		queryKey: areaKeys.all,
		queryFn: () => fetchAreas(),
	});
	const { configByArea, workPattern } = useCommonData();

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-250">
				<div className="text-[22px] font-bold">配置ビュアー</div>
				<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
					エリアを選んで、現在の配置を大きく表示します。表示内容はエリアごとの設定に従います。
				</div>

				<div className="grid grid-cols-3 gap-4">
					{areas.map((area) => (
						<ViewerAreaCard
							key={area.id}
							area={area}
							config={configByArea.get(area.id) ?? defaultConfig(area.id)}
							workPattern={workPattern}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function ViewerAreaCard({
	area,
	config,
	workPattern,
}: {
	area: AreaListItem;
	config: ViewerConfig;
	workPattern: ReturnType<typeof useCommonData>["workPattern"];
}) {
	const navigate = useNavigate();
	const display = workPattern
		? resolveViewerDisplay(config, workPattern, new Date())
		: null;

	const { data: assignments = [] } = useQuery({
		queryKey: display
			? assignmentKeys.byDateShift(display.date, display.shiftId)
			: ["viewer-card-idle", area.id],
		queryFn: () =>
			fetchAssignments({
				date: (display as { date: string }).date,
				shiftId: (display as { shiftId: string | null }).shiftId,
			}),
		enabled: !!display,
	});
	const assigned =
		assignments.find((a) => a.areaId === area.id && a.status === "confirmed")
			?.spotAssignments.length ?? 0;
	const total = area.spotCount;
	const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
	const full = total > 0 && assigned === total;

	return (
		<button
			type="button"
			onClick={() => navigate({ to: "/viewer", search: { area: area.id } })}
			className="text-left bg-surface border border-border rounded-lg p-4.5 shadow-card cursor-pointer hover:shadow-float transition-shadow duration-150"
		>
			<div className="flex items-center justify-between gap-2.5">
				<div className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">
					{area.name}
				</div>
				{area.currentVersion && (
					<span className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2.25 py-0.75 rounded-pill shrink-0">
						{area.currentVersion}
					</span>
				)}
			</div>
			<div className="flex items-center justify-between mt-4 mb-1.75">
				<div className="text-xs text-muted">配置状況</div>
				<div className="text-xs font-bold">
					{assigned} / {total} 名
				</div>
			</div>
			<div className="h-1.75 rounded-pill bg-hairline overflow-hidden">
				<div
					className="h-full rounded-pill"
					style={{
						width: `${pct}%`,
						background: full ? "var(--color-success)" : "var(--color-primary)",
					}}
				/>
			</div>
			<div className="flex justify-end mt-3.5">
				<div className="text-xs font-bold text-primary">大きく表示 →</div>
			</div>
		</button>
	);
}

function ViewerDetail({ areaId }: { areaId: string }) {
	const navigate = useNavigate();
	const { configByArea, workPattern } = useCommonData();
	const [zoom, setZoom] = useState(1);
	const [panelOpen, setPanelOpen] = useState(true);
	const [now, setNow] = useState(() => new Date());
	const boardRef = useRef<HTMLDivElement>(null);

	// 現在日時を毎秒更新（auto の現在シフト解決にも使う）
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);

	const config = configByArea.get(areaId) ?? defaultConfig(areaId);
	const display = workPattern
		? resolveViewerDisplay(config, workPattern, now)
		: null;
	const date = display?.date ?? null;
	const shiftId = display?.shiftId ?? null;
	const shift = shiftId
		? (workPattern?.shifts.find((s) => s.id === shiftId) ?? null)
		: null;
	const shiftLabel = shiftId
		? (shift?.name ?? config.shiftName ?? "シフト")
		: "終日";
	const shiftStart = shift?.startTime ?? config.shiftStartTime;
	const shiftEnd = shift?.endTime ?? config.shiftEndTime;
	const shiftTime =
		shiftId && shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : null;
	// 現在日（時計）と表示対象日が異なるときだけ対象日を出す（同日での日付二重表示を避ける）
	const showTargetDate = !!date && date !== toDateStr(now);

	const { data: area } = useQuery({
		queryKey: areaKeys.detail(areaId),
		queryFn: () => fetchArea(areaId),
	});
	const { data: assignments = [] } = useQuery({
		queryKey: date
			? assignmentKeys.byDateShift(date, shiftId)
			: ["viewer-detail-idle", areaId],
		queryFn: () => fetchAssignments({ date: date as string, shiftId }),
		enabled: !!date,
	});
	const { data: employees = [] } = useQuery({
		queryKey: ["employees"],
		queryFn: fetchEmployees,
	});

	const serverAssignment =
		assignments.find((a) => a.areaId === areaId && a.status === "confirmed") ??
		null;
	// 確定配置があればその版、無ければ現在の公開版でレイアウトのみ表示
	const currentVersionId = area?.versions.find((v) => v.isCurrent)?.id ?? null;
	const versionId = serverAssignment?.layoutSpecVersionId ?? currentVersionId;

	const { data: spots = [] } = useQuery({
		queryKey: areaKeys.versionSpots(areaId, versionId ?? ""),
		queryFn: () => fetchVersionSpots(areaId, versionId as string),
		enabled: !!versionId,
	});

	const empById = useMemo(() => {
		const m = new Map<string, EmployeeRow>();
		for (const e of employees) m.set(e.id, e);
		return m;
	}, [employees]);
	const assignBySpot = useMemo(() => {
		const m = new Map<string, EmployeeRow | undefined>();
		for (const sa of serverAssignment?.spotAssignments ?? []) {
			m.set(sa.spotId, empById.get(sa.employeeId));
		}
		return m;
	}, [serverAssignment, empById]);

	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(
				ZOOM_MAX,
				Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100),
			),
		);

	const assignedCount = serverAssignment?.spotAssignments.length ?? 0;
	const totalCount = spots.length;
	const aspect = area?.planAspectRatio ?? 4 / 3;

	// 配置済みメンバー（スポット順）
	const members = spots
		.map((s) => ({ spot: s, emp: assignBySpot.get(s.id) }))
		.filter((m): m is { spot: (typeof spots)[number]; emp: EmployeeRow } =>
			Boolean(m.emp),
		);
	const clock = formatClock(now);

	// ボードの表示領域いっぱいにフロアマップを収めるズーム倍率を算出して適用する
	const fitToScreen = useCallback(() => {
		const el = boardRef.current;
		if (!el) return;
		const availW = el.clientWidth - BOARD_PADDING;
		const availH = el.clientHeight - BOARD_PADDING;
		if (availW <= 0 || availH <= 0) return;
		const z = Math.min(availW / BASE_WIDTH, availH / (BASE_WIDTH / aspect));
		setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100)));
	}, [aspect]);

	// スポット読込・アスペクト比確定時に画面いっぱいへ自動フィット
	useEffect(() => {
		if (totalCount > 0) fitToScreen();
	}, [fitToScreen, totalCount]);

	// ボードの表示領域が変わったら（ウィンドウリサイズ・パネル開閉）再フィット
	// レイアウト確定後に測るため次フレームで実行する
	useEffect(() => {
		const el = boardRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() =>
			requestAnimationFrame(() => fitToScreen()),
		);
		ro.observe(el);
		return () => ro.disconnect();
	}, [fitToScreen]);

	return (
		// 表示に集中するためアプリのサイドバー・ヘッダーを覆う全画面オーバーレイ
		<div className="fixed inset-0 z-50 flex flex-col bg-app-bg">
			<div className="shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-surface">
				<div className="flex items-center gap-3 min-w-0">
					<button
						type="button"
						onClick={() => navigate({ to: "/viewer", search: {} })}
						className="font-sans text-[12.5px] font-semibold text-muted bg-transparent border-none px-2 py-1.5 rounded-sm cursor-pointer hover:bg-hairline"
					>
						← ビュアー一覧
					</button>
					<div className="w-px h-4.5 bg-border" />
					<div className="text-[20px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
						{area?.name ?? ""}
					</div>
					{display && (
						<div className="flex items-center gap-2 shrink-0">
							{showTargetDate && date && (
								<span className="text-[13px] font-bold text-ink border border-border px-3 py-1.5 rounded-pill">
									表示日 {formatDateLabel(date)}
								</span>
							)}
							<span className="text-[13px] font-bold text-primary-hover bg-primary-soft px-3 py-1.5 rounded-pill">
								{shiftLabel}
								{shiftTime && (
									<span className="font-semibold text-primary-hover/80 ml-1.5 tabular-nums">
										{shiftTime}
									</span>
								)}
							</span>
						</div>
					)}
				</div>
				<div className="flex items-center gap-4 shrink-0">
					<div className="text-base font-bold text-ink tabular-nums">
						{clock}
					</div>
					<div className="flex items-baseline gap-1.5">
						<div className="text-2xl font-bold text-primary leading-none">
							{assignedCount}
						</div>
						<div className="text-sm text-faint font-semibold">
							/ {totalCount} 名
						</div>
					</div>
					<button
						type="button"
						aria-label="メンバーパネルの表示切替"
						aria-pressed={panelOpen}
						title="メンバーパネル"
						onClick={() => setPanelOpen((o) => !o)}
						className={`flex items-center justify-center w-9 h-9 rounded-md border cursor-pointer ${
							panelOpen
								? "text-primary border-primary bg-primary-soft"
								: "text-muted border-border bg-surface hover:bg-hairline"
						}`}
					>
						<PanelIcon />
					</button>
				</div>
			</div>

			<div className="flex-1 min-h-0 flex">
				<div ref={boardRef} className="flex-1 min-h-0 relative flex flex-col">
					{totalCount > 0 ? (
						<PlacementViewCanvas
							spots={spots}
							assignBySpot={assignBySpot}
							planImageUrl={area?.planImageUrl ?? null}
							planImageScale={area?.planImageScale ?? 1}
							aspect={aspect}
							zoom={zoom}
						/>
					) : (
						<div className="flex-1 m-5.5 rounded-md border-[1.6px] border-dashed border-dash bg-empty-bg flex flex-col items-center justify-center gap-2">
							<div className="text-sm font-bold text-muted">
								このエリアの図面が未設定です
							</div>
							<div className="text-xs text-faint">
								配置エディタで図面を登録してください
							</div>
						</div>
					)}

					{totalCount > 0 && (
						<div className="absolute right-5.5 bottom-5.5 flex items-center gap-1.5 bg-surface border border-border rounded-pill px-2 py-1.25 shadow-float">
							<button
								type="button"
								onClick={() => changeZoom(-0.25)}
								disabled={zoom <= ZOOM_MIN}
								className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-lg font-bold text-ink hover:bg-hairline cursor-pointer disabled:text-disabled disabled:cursor-not-allowed border-none bg-transparent"
							>
								−
							</button>
							<div className="text-xs font-bold text-muted min-w-11.5 text-center tabular-nums">
								{Math.round(zoom * 100)}%
							</div>
							<button
								type="button"
								onClick={() => changeZoom(0.25)}
								disabled={zoom >= ZOOM_MAX}
								className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-lg font-bold text-ink hover:bg-hairline cursor-pointer disabled:text-disabled disabled:cursor-not-allowed border-none bg-transparent"
							>
								＋
							</button>
							<div className="w-px h-4.5 bg-border mx-0.5" />
							<button
								type="button"
								onClick={fitToScreen}
								className="text-xs font-bold text-primary px-2.75 py-1.5 rounded-pill cursor-pointer border-none bg-transparent hover:bg-hairline"
							>
								フィット
							</button>
						</div>
					)}
				</div>

				{panelOpen && (
					<aside className="w-72 shrink-0 border-l border-border bg-surface flex flex-col">
						<div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
							<div className="text-[13px] font-bold">
								配置メンバー{" "}
								<span className="text-faint font-semibold">
									{members.length}名
								</span>
							</div>
							<button
								type="button"
								aria-label="パネルを閉じる"
								onClick={() => setPanelOpen(false)}
								className="w-7 h-7 flex items-center justify-center rounded-sm text-muted hover:bg-hairline cursor-pointer border-none bg-transparent text-base"
							>
								×
							</button>
						</div>
						<div className="flex-1 min-h-0 overflow-auto p-2.5 flex flex-col gap-1.5">
							{members.length === 0 ? (
								<div className="text-xs text-faint text-center py-8">
									配置されているメンバーはいません
								</div>
							) : (
								members.map(({ spot, emp }) => (
									<div
										key={spot.id}
										className="flex items-center gap-2.5 p-1.75 rounded-md border border-border bg-surface"
									>
										<Avatar
											name={emp.lastName}
											color={emp.avatarColor}
											size={30}
										/>
										<div className="min-w-0 flex-1">
											<div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
												{emp.lastName} {emp.firstName}
											</div>
											<div className="text-[11px] text-faint">
												スポット {spot.label}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</aside>
				)}
			</div>
		</div>
	);
}

function PanelIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<line x1="15" y1="4" x2="15" y2="20" />
		</svg>
	);
}
