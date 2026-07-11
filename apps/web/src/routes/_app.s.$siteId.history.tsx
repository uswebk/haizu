import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "#/components/ui/Avatar";
import { PagerButton } from "#/components/ui/PagerButton";
import { PlacementViewCanvas } from "#/features/assignment/PlacementViewCanvas";
import type { EmployeeRow } from "#/features/employees/types";
import { areaKeys, fetchArea, fetchVersionSpots } from "#/lib/api/areas";
import {
	assignmentKeys,
	fetchAssignmentHistory,
	fetchAssignments,
	historyKeys,
} from "#/lib/api/assignments";
import { fetchEmployees } from "#/lib/api/employees";
import { formatDateLabel, yesterdayStr } from "#/lib/datetime";
import { assertScreen } from "#/lib/guards";

type HistorySearch = {
	date?: string;
	page?: number;
	selArea?: string;
	selDate?: string;
	selShift?: string;
	selShiftLabel?: string;
};

export const Route = createFileRoute("/_app/s/$siteId/history")({
	validateSearch: (search): HistorySearch => ({
		date: typeof search.date === "string" ? search.date : undefined,
		page:
			typeof search.page === "number" && search.page > 1
				? search.page
				: undefined,
		selArea: typeof search.selArea === "string" ? search.selArea : undefined,
		selDate: typeof search.selDate === "string" ? search.selDate : undefined,
		selShift: typeof search.selShift === "string" ? search.selShift : undefined,
		selShiftLabel:
			typeof search.selShiftLabel === "string"
				? search.selShiftLabel
				: undefined,
	}),
	beforeLoad: ({ context, params }) => {
		assertScreen(context.user.role, context.siteRole, params.siteId, "history");
	},
	component: History,
});

const PAGE_SIZE = 50;

function useEmployeeMap() {
	const { data: employees = [] } = useQuery({
		queryKey: ["employees"],
		queryFn: fetchEmployees,
	});
	return useMemo(() => {
		const m = new Map<string, EmployeeRow>();
		for (const e of employees) m.set(e.id, e);
		return m;
	}, [employees]);
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

function History() {
	const search = Route.useSearch();
	const isDetail = !!(search.selArea && search.selDate);
	return isDetail ? <HistoryDetail /> : <HistoryList />;
}

function HistoryList() {
	const search = Route.useSearch();
	const { siteId } = Route.useParams();
	const { t } = useTranslation(["history", "assignment", "common"]);
	const navigate = useNavigate();
	// 日付は必須。未指定時は前日をデフォルトにする（全件検索を防ぐため）
	const filterDate = search.date ?? yesterdayStr();
	const page = search.page ?? 1;
	const empById = useEmployeeMap();

	const { data } = useQuery({
		queryKey: historyKeys.list(filterDate, page),
		queryFn: () =>
			fetchAssignmentHistory({
				date: filterDate,
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
			}),
		placeholderData: keepPreviousData,
	});
	const entries = data?.entries ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	// 日付フィルタを変えたらページを1に戻す
	const setDate = (date: string) =>
		navigate({
			to: "/s/$siteId/history",
			params: { siteId },
			search: (prev) => ({ ...prev, date, page: undefined }),
		});
	const setPage = (next: number) =>
		navigate({
			to: "/s/$siteId/history",
			params: { siteId },
			search: (prev) => ({ ...prev, page: next }),
		});

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-250">
				<div className="flex items-end justify-between gap-4 mb-4.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">{t("history:title")}</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							{t("history:subtitle")}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="date"
							value={filterDate}
							onChange={(e) => {
								if (e.target.value) setDate(e.target.value);
							}}
							className="font-sans text-[13px] font-bold text-ink border border-border rounded-md px-3.25 py-2.25 bg-surface outline-none"
						/>
					</div>
				</div>

				{entries.length === 0 ? (
					<div className="border-[1.4px] border-dashed border-dash rounded-lg p-12 text-center bg-empty-bg">
						<div className="text-[15px] font-bold text-muted">
							{t("history:noRecords")}
						</div>
						<div className="text-[12.5px] text-faint mt-1.5">
							{t("history:tryAnotherDate")}
						</div>
					</div>
				) : (
					<div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
						<div className="grid grid-cols-[1.1fr_0.8fr_1.4fr_2fr_0.6fr] px-4 py-2.75 bg-table-head text-[11.5px] font-bold text-faint tracking-wide">
							<div>{t("history:colDate")}</div>
							<div>{t("history:colShift")}</div>
							<div>{t("history:colArea")}</div>
							<div>{t("history:colMembers")}</div>
							<div />
						</div>
						{entries.map((entry) => {
							const shiftLabel = entry.shiftName ?? t("assignment:allDay");
							const avatars = entry.employeeIds.slice(0, 4);
							const moreCount = entry.employeeIds.length - avatars.length;
							return (
								<button
									key={entry.id}
									type="button"
									onClick={() =>
										navigate({
											to: "/s/$siteId/history",
											params: { siteId },
											search: (prev) => ({
												...prev,
												selArea: entry.areaId,
												selDate: entry.date,
												selShift: entry.shiftId ?? undefined,
												selShiftLabel: shiftLabel,
											}),
										})
									}
									className="w-full text-left grid grid-cols-[1.1fr_0.8fr_1.4fr_2fr_0.6fr] items-center px-4 py-3.25 border-t border-hairline text-[13.5px] cursor-pointer hover:bg-app-bg bg-transparent border-x-0 border-b-0"
								>
									<div className="font-bold">{formatDateLabel(entry.date)}</div>
									<div>
										<span className="text-[11.5px] font-bold text-primary-hover bg-primary-soft px-2.5 py-1 rounded-pill">
											{shiftLabel}
										</span>
									</div>
									<div className="font-semibold">
										{entry.areaName}{" "}
										<span className="text-[11.5px] text-faint font-semibold">
											{t("history:peopleCount", {
												count: entry.employeeIds.length,
											})}
										</span>
									</div>
									<div className="flex items-center gap-1.25">
										{avatars.map((id) => {
											const emp = empById.get(id);
											return (
												<Avatar
													key={id}
													name={emp?.lastName ?? "?"}
													color={emp?.avatarColor}
													size={26}
												/>
											);
										})}
										{moreCount > 0 && (
											<div className="text-[11px] font-bold text-faint ml-0.5">
												+{moreCount}
											</div>
										)}
									</div>
									<div className="text-right text-[12.5px] font-bold text-primary">
										{t("history:view")}
									</div>
								</button>
							);
						})}
					</div>
				)}

				{total > PAGE_SIZE && (
					<div className="flex items-center justify-between mt-3.5">
						<div className="text-xs font-semibold text-muted">
							{t("history:showing", {
								total,
								from: (page - 1) * PAGE_SIZE + 1,
								to: Math.min(page * PAGE_SIZE, total),
							})}
						</div>
						<div className="flex items-center gap-1.5">
							<PagerButton
								onClick={() => setPage(page - 1)}
								disabled={page <= 1}
							>
								{t("common:prev")}
							</PagerButton>
							<span className="text-xs font-semibold text-ink px-1.5">
								{page} / {pageCount}
							</span>
							<PagerButton
								onClick={() => setPage(page + 1)}
								disabled={page >= pageCount}
							>
								{t("common:next")}
							</PagerButton>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function HistoryDetail() {
	const { siteId } = Route.useParams();
	const { t } = useTranslation(["history", "assignment"]);
	const search = Route.useSearch();
	const navigate = useNavigate();
	const areaId = search.selArea as string;
	const date = search.selDate as string;
	const shiftId = search.selShift ?? null;
	const shiftLabel = search.selShiftLabel ?? t("assignment:allDay");
	const empById = useEmployeeMap();

	const { data: area } = useQuery({
		queryKey: areaKeys.detail(areaId),
		queryFn: () => fetchArea(areaId),
	});
	const { data: assignments = [] } = useQuery({
		queryKey: assignmentKeys.byDateShift(date, shiftId),
		queryFn: () => fetchAssignments({ date, shiftId }),
	});
	const serverAssignment = assignments.find((a) => a.areaId === areaId) ?? null;
	const versionId = serverAssignment?.layoutSpecVersionId ?? null;
	const versionLabel =
		area?.versions.find((v) => v.id === versionId)?.label ?? null;

	const [zoom, setZoom] = useState(1);
	const changeZoom = (delta: number) =>
		setZoom((z) =>
			Math.min(
				ZOOM_MAX,
				Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100),
			),
		);

	const { data: spots = [] } = useQuery({
		queryKey: areaKeys.versionSpots(areaId, versionId ?? ""),
		queryFn: () => fetchVersionSpots(areaId, versionId as string),
		enabled: !!versionId,
	});

	const assignBySpot = useMemo(() => {
		const m = new Map<string, EmployeeRow | undefined>();
		for (const sa of serverAssignment?.spotAssignments ?? []) {
			m.set(sa.spotId, empById.get(sa.employeeId));
		}
		return m;
	}, [serverAssignment, empById]);

	const back = () =>
		navigate({
			to: "/s/$siteId/history",
			params: { siteId },
			search: (prev) => ({
				...prev,
				selArea: undefined,
				selDate: undefined,
				selShift: undefined,
				selShiftLabel: undefined,
			}),
		});

	const assignedCount = serverAssignment?.spotAssignments.length ?? 0;
	const aspect = area?.planAspectRatio ?? 4 / 3;

	return (
		<div className="p-7 h-full">
			<div className="flex flex-col h-full min-w-190 bg-surface border border-border rounded-lg overflow-hidden shadow-card">
				<div className="h-12.5 shrink-0 flex items-center justify-between px-3.5 border-b border-border gap-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<button
							type="button"
							onClick={back}
							className="font-sans text-[12.5px] font-semibold text-muted bg-transparent border-none px-2 py-1.5 rounded-sm cursor-pointer hover:bg-hairline"
						>
							{t("history:backToList")}
						</button>
						<div className="w-px h-4.5 bg-border" />
						<div className="text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis">
							{area?.name ?? ""}
						</div>
						{versionLabel && (
							<span className="text-[10.5px] font-bold text-muted bg-table-head border border-hairline px-2.5 py-1 rounded-pill shrink-0 font-mono">
								{t("assignment:specVersion", { version: versionLabel })}
							</span>
						)}
						<span className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2.5 py-1 rounded-pill shrink-0">
							{t("history:readOnly")}
						</span>
					</div>
					<div className="text-[12.5px] font-bold text-ink border border-border px-3 py-1.5 rounded-pill shrink-0">
						{formatDateLabel(date)} ・ {shiftLabel}
					</div>
				</div>

				<div className="flex-1 min-h-0 p-4.5 bg-app-bg flex flex-col">
					<div className="flex items-center justify-between mb-2.5 shrink-0">
						<div className="text-[13px] font-bold">
							{t("history:placedCount", { count: assignedCount })}
						</div>
						{spots.length > 0 && (
							<div className="flex items-center gap-1 border border-border rounded-sm bg-surface px-1 py-0.5">
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
					<PlacementViewCanvas
						spots={spots}
						assignBySpot={assignBySpot}
						planImageUrl={area?.planImageUrl ?? null}
						planImageScale={area?.planImageScale ?? 1}
						aspect={aspect}
						zoom={zoom}
					/>
				</div>
			</div>
		</div>
	);
}
