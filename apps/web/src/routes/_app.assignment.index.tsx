import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShiftDatePicker } from "#/features/assignment/ShiftDatePicker";
import {
	getShiftOptions,
	resolveEffectiveShift,
	todayStr,
} from "#/features/assignment/shift";
import { fetchAreas } from "#/lib/api/areas";
import { assignmentKeys, fetchAssignments } from "#/lib/api/assignments";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";

export const Route = createFileRoute("/_app/assignment/")({
	component: AssignmentList,
});

function AssignmentList() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const date = search.date ?? todayStr();

	const { data: areas = [] } = useQuery({
		queryKey: ["areas", date],
		queryFn: () => fetchAreas(date),
	});
	const { data: workPattern } = useQuery({
		queryKey: workPatternKeys.detail,
		queryFn: fetchWorkPattern,
	});

	const shiftOptions = getShiftOptions(workPattern);
	const effective = resolveEffectiveShift(workPattern, search.shiftId);

	const { data: assignments = [] } = useQuery({
		queryKey: assignmentKeys.byDateShift(date, effective.shiftId),
		queryFn: () => fetchAssignments({ date, shiftId: effective.shiftId }),
		enabled: !!workPattern,
	});

	const assignedByArea = new Map(
		assignments.map((a) => [a.areaId, a.spotAssignments.length]),
	);

	const setDate = (d: string) =>
		navigate({ to: "/assignment", search: (prev) => ({ ...prev, date: d }) });
	const setShift = (id: string) =>
		navigate({
			to: "/assignment",
			search: (prev) => ({ ...prev, shiftId: id }),
		});

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-245">
				<div className="flex items-end justify-between gap-5 mb-4.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">配置決め</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							エリアを選び、アクティブな規格に従業員を配置します。
						</div>
					</div>
					<ShiftDatePicker
						date={date}
						onDateChange={setDate}
						shiftId={effective.shiftId}
						shiftLabel={effective.label}
						options={shiftOptions}
						onShiftChange={setShift}
					/>
				</div>

				<div className="grid grid-cols-3 gap-4">
					{areas.map((area) => {
						const total = area.spotCount;
						const assigned = assignedByArea.get(area.id) ?? 0;
						const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
						const full = total > 0 && assigned === total;
						const isPublished = area.currentStatus === "published";

						if (!isPublished) {
							return (
								<div
									key={area.id}
									title="配置エディタで規格を公開すると配置決めができます"
									className="text-left bg-surface border border-border rounded-lg p-4.5 opacity-55 cursor-not-allowed"
								>
									<div className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">
										{area.name}
									</div>
									<div className="text-xs text-faint mt-4">
										規格が未公開です
									</div>
								</div>
							);
						}

						return (
							<button
								key={area.id}
								type="button"
								onClick={() =>
									navigate({
										to: "/assignment/$areaId",
										params: { areaId: area.id },
										search: (prev) => ({ ...prev, date }),
									})
								}
								className="text-left bg-surface border border-border rounded-lg p-4.5 shadow-card cursor-pointer hover:shadow-float transition-shadow duration-150"
							>
								<div className="flex items-center justify-between gap-2.5">
									<div className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">
										{area.name}
									</div>
									{area.currentVersion && (
										<span className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2.25 py-0.75 rounded-pill shrink-0">
											規格 {area.currentVersion}
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
											background: full
												? "var(--color-success)"
												: "var(--color-primary)",
										}}
									/>
								</div>
								<div className="flex justify-end mt-3.5">
									<div className="text-xs font-bold text-primary">
										配置する →
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
