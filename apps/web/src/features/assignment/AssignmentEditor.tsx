import type { Assignment, AssignmentStatus, Shift } from "@haizu/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { useSnackbar } from "#/contexts/snackbar-context";
import type {
	AreaData,
	SpotState,
	VersionState,
} from "#/features/editor/types";
import type { EmployeeRow } from "#/features/employees/types";
import { assignmentKeys, saveAssignment } from "#/lib/api/assignments";
import { AssignmentConfirmDialog } from "./AssignmentConfirmDialog";
import { AssignmentPlanCanvas } from "./AssignmentPlanCanvas";
import { AssignmentPool } from "./AssignmentPool";
import { ShiftDatePicker } from "./ShiftDatePicker";
import { SpotInspector } from "./SpotInspector";
import type { ShiftOption } from "./shift";
import { useAssignmentDraft } from "./useAssignmentDraft";

type Props = {
	area: AreaData;
	spots: SpotState[];
	employees: EmployeeRow[];
	date: string;
	shiftId: string | null;
	shiftLabel: string;
	shift: Shift | undefined;
	shiftOptions: ShiftOption[];
	activeVersion: VersionState;
	versionId: string;
	serverAssignment: Assignment | null;
	onBack: () => void;
	setDate: (date: string) => void;
	setShift: (shiftId: string) => void;
};

export function AssignmentEditor({
	area,
	spots,
	employees,
	date,
	shiftId,
	shiftLabel,
	shift,
	shiftOptions,
	activeVersion,
	versionId,
	serverAssignment,
	onBack,
	setDate,
	setShift,
}: Props) {
	const { t } = useTranslation(["assignment", "editor", "common"]);
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const { assign, dragId, assignToSpot, unassignSpot, onDropToPool } =
		useAssignmentDraft(serverAssignment);

	const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<AssignmentStatus | null>(
		null,
	);

	const empById = useMemo(() => {
		const m = new Map<string, EmployeeRow>();
		for (const e of employees) m.set(e.id, e);
		return m;
	}, [employees]);

	const assignedIds = new Set(Object.values(assign));
	const assignedCount = Object.keys(assign).length;
	const totalCount = spots.length;
	const selectedSpotObj = spots.find((s) => s.id === selectedSpot) ?? null;
	const selectedEmpId = selectedSpot ? assign[selectedSpot] : undefined;
	const selectedEmp = selectedEmpId ? empById.get(selectedEmpId) : undefined;

	const saveMutation = useMutation({
		mutationFn: (status: AssignmentStatus) =>
			saveAssignment({
				areaId: area.id,
				layoutSpecVersionId: versionId,
				date,
				shiftId,
				status,
				spotAssignments: Object.entries(assign).map(([spotId, employeeId]) => ({
					spotId,
					employeeId,
				})),
			}),
		onSuccess: (_data, status) => {
			setConfirmAction(null);
			void queryClient.invalidateQueries({
				queryKey: assignmentKeys.byDateShift(date, shiftId),
			});
			showSuccess(
				status === "confirmed"
					? t("assignment:detail.confirmed")
					: t("assignment:detail.draftSaved"),
			);
		},
	});

	const isConfirmed = serverAssignment?.status === "confirmed";

	return (
		<div className="flex flex-col h-full min-w-220 bg-surface border border-border rounded-lg overflow-hidden shadow-card">
			<div className="h-12.5 shrink-0 flex items-center justify-between px-3.5 border-b border-border gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					<Button variant="ghost" size="sm" onClick={onBack}>
						{t("assignment:detail.backToList")}
					</Button>
					<div className="w-px h-4.5 bg-border" />
					<div className="text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis">
						{area.name}
					</div>
					<span className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2.5 py-1 rounded-pill shrink-0">
						{t("assignment:detail.specInUse", { version: activeVersion.label })}
					</span>
					{isConfirmed && (
						<span className="text-[10.5px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-pill shrink-0">
							{t("assignment:detail.confirmedBadge")}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2.5 shrink-0">
					<ShiftDatePicker
						date={date}
						onDateChange={setDate}
						shiftId={shiftId}
						shiftLabel={shiftLabel}
						options={shiftOptions}
						onShiftChange={setShift}
					/>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setConfirmAction("draft")}
						disabled={saveMutation.isPending}
					>
						{isConfirmed
							? t("assignment:detail.revertToDraft")
							: t("editor:saveDraft")}
					</Button>
					<Button
						size="sm"
						onClick={() => setConfirmAction("confirmed")}
						disabled={saveMutation.isPending}
					>
						{isConfirmed
							? t("assignment:detail.update")
							: t("assignment:detail.confirm")}
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 flex">
				<AssignmentPool
					employees={employees}
					assignedIds={assignedIds}
					selectedSpot={selectedSpot}
					dragId={dragId}
					onAssignToSelected={(empId) => {
						if (selectedSpot) assignToSpot(selectedSpot, empId);
					}}
					onDropToPool={onDropToPool}
				/>
				<AssignmentPlanCanvas
					area={area}
					spots={spots}
					assign={assign}
					empById={empById}
					selectedSpot={selectedSpot}
					setSelectedSpot={setSelectedSpot}
					assignToSpot={assignToSpot}
					dragId={dragId}
					assignedCount={assignedCount}
					totalCount={totalCount}
					hasVersion
				/>
				<SpotInspector
					selectedSpot={selectedSpotObj}
					selectedEmp={selectedEmp}
					onDeselect={() => setSelectedSpot(null)}
					onUnassignSpot={unassignSpot}
					assignedCount={assignedCount}
					totalCount={totalCount}
					activeVersion={activeVersion}
					shiftLabel={shiftLabel}
					shift={shift}
				/>
			</div>

			{confirmAction && (
				<AssignmentConfirmDialog
					action={confirmAction}
					date={date}
					shiftLabel={shiftLabel}
					shift={shift}
					areaName={area.name}
					assignedCount={assignedCount}
					totalCount={totalCount}
					pending={saveMutation.isPending}
					onCancel={() => setConfirmAction(null)}
					onConfirm={() => saveMutation.mutate(confirmAction)}
				/>
			)}
		</div>
	);
}
