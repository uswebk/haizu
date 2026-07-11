import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { fetchArea, fetchVersionSpots } from "#/lib/api/areas";
import { assignmentKeys, fetchAssignments } from "#/lib/api/assignments";
import { fetchEmployees } from "#/lib/api/employees";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";
import { AssignmentEditor } from "./AssignmentEditor";
import { resolveVersionForDate } from "./layoutVersion";
import { getShiftOptions, resolveEffectiveShift } from "./shift";

type Props = {
	siteId: string;
	areaId: string;
	date: string;
	searchShiftId: string | undefined;
};

export function AssignmentDetailPage({
	siteId,
	areaId,
	date,
	searchShiftId,
}: Props) {
	const navigate = useNavigate();
	const { t } = useTranslation(["assignment", "editor", "common"]);

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

	// Assignment references the published spec applied on the target date (the newest with an effective date on or before it)
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
	const effective = resolveEffectiveShift(workPattern, searchShiftId);
	const effectiveShift = workPattern?.shifts.find(
		(s) => s.id === effective.shiftId,
	);

	const assignmentsQuery = useQuery({
		queryKey: assignmentKeys.byDateShift(date, effective.shiftId),
		queryFn: () => fetchAssignments({ date, shiftId: effective.shiftId }),
		enabled: !!workPattern,
	});
	const serverAssignment =
		assignmentsQuery.data?.find((a) => a.areaId === areaId) ?? null;

	const goToList = () =>
		navigate({
			to: "/s/$siteId/assignment",
			params: { siteId },
			search: (prev) => ({ ...prev, date }),
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

	if (workPattern === null) {
		return (
			<Shell onBack={goToList}>
				<div className="flex-1 flex flex-col items-center justify-center gap-2.5">
					<div className="text-sm font-bold">
						{t("assignment:detail.noShift")}
					</div>
					<div className="text-xs text-faint">
						{t("assignment:detail.noShiftHint")}
					</div>
					<Link
						to="/s/$siteId/settings/shifts"
						params={{ siteId }}
						className="mt-1 text-[13px] font-bold text-primary hover:text-primary-hover"
					>
						{t("assignment:registerShift")}
					</Link>
				</div>
			</Shell>
		);
	}

	if (isUnpublished) {
		return (
			<Shell onBack={goToList} title={area?.name}>
				<div className="flex-1 flex flex-col items-center justify-center gap-2.5">
					<div className="text-sm font-bold">
						{t("assignment:detail.noSpec")}
					</div>
					<div className="text-xs text-faint">
						{t("assignment:detail.noSpecHint")}
					</div>
				</div>
			</Shell>
		);
	}

	// Wait for area / active version / the assignment fetch before mounting the editor,
	// so the draft state is seeded from the settled server assignment on mount.
	if (!area || !activeVersion || !versionId || assignmentsQuery.isPending) {
		return (
			<div className="p-7 h-full">
				<div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden shadow-card" />
			</div>
		);
	}

	return (
		<div className="p-7 h-full">
			<AssignmentEditor
				key={`${versionId}:${date}:${effective.shiftId ?? "none"}`}
				area={area}
				spots={spots}
				employees={employees}
				date={date}
				shiftId={effective.shiftId}
				shiftLabel={effective.label}
				shift={effectiveShift}
				shiftOptions={shiftOptions}
				activeVersion={activeVersion}
				versionId={versionId}
				serverAssignment={serverAssignment}
				onBack={goToList}
				setDate={setDate}
				setShift={setShift}
			/>
		</div>
	);
}

function Shell({
	onBack,
	title,
	children,
}: {
	onBack: () => void;
	title?: string;
	children: React.ReactNode;
}) {
	const { t } = useTranslation(["assignment"]);
	return (
		<div className="p-7 h-full">
			<div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden shadow-card">
				<div className="h-12.5 shrink-0 flex items-center gap-2.5 px-3.5 border-b border-border">
					<Button variant="ghost" size="sm" onClick={onBack}>
						{t("assignment:detail.backToList")}
					</Button>
					{title && (
						<>
							<div className="w-px h-4.5 bg-border" />
							<div className="text-sm font-bold">{title}</div>
						</>
					)}
				</div>
				{children}
			</div>
		</div>
	);
}
