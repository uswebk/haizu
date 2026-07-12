import type { Shift } from "@haizu/shared";
import { useTranslation } from "react-i18next";
import { Avatar } from "#/components/ui/Avatar";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import type { SpotState, VersionState } from "#/features/editor/types";
import type { EmployeeRow } from "#/features/employees/types";

type Props = {
	selectedSpot: SpotState | null;
	selectedEmp: EmployeeRow | undefined;
	onDeselect: () => void;
	onUnassignSpot: (spotId: string) => void;
	assignedCount: number;
	totalCount: number;
	activeVersion: VersionState;
	shiftLabel: string;
	shift: Shift | undefined;
};

export function SpotInspector({
	selectedSpot,
	selectedEmp,
	onDeselect,
	onUnassignSpot,
	assignedCount,
	totalCount,
	activeVersion,
	shiftLabel,
	shift,
}: Props) {
	const { t } = useTranslation(["assignment"]);

	return (
		<div className="w-59 shrink-0 border-l border-border p-4 flex flex-col gap-4 overflow-auto">
			{selectedSpot ? (
				<div>
					<div className="flex items-center justify-between mb-2.5">
						<div className="text-[10.5px] font-bold tracking-widest text-faint">
							{t("assignment:detail.spot", { label: selectedSpot.label })}
						</div>
						<button
							type="button"
							onClick={onDeselect}
							title={t("assignment:detail.deselectShort")}
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
									{selectedEmp.tags.map((tag) => (
										<Badge key={tag.id} tone="primary">
											{tag.name}
										</Badge>
									))}
								</div>
							)}
							<Button
								variant="danger"
								size="sm"
								className="w-full mt-3.5"
								onClick={() => onUnassignSpot(selectedSpot.id)}
							>
								{t("assignment:detail.unassign")}
							</Button>
						</div>
					) : (
						<div className="border-[1.4px] border-dashed border-primary-soft-bd rounded-lg p-4 text-center bg-primary-soft/30">
							<div className="text-[13px] font-bold text-primary-hover">
								{t("assignment:detail.unassignedSpot")}
							</div>
							<div className="text-[11.5px] text-muted mt-1.5 leading-relaxed">
								{t("assignment:detail.unassignedSpotHint")}
							</div>
						</div>
					)}
				</div>
			) : (
				<>
					<div>
						<div className="text-[10.5px] font-bold tracking-widest text-faint mb-2.25">
							{t("assignment:placementStatus")}
						</div>
						<div className="border border-border rounded-lg p-3.25">
							<div className="flex items-baseline gap-1.5">
								<div className="text-[26px] font-bold text-primary">
									{assignedCount}
								</div>
								<div className="text-[13px] font-semibold text-faint">
									{t("assignment:detail.ofTotal", { total: totalCount })}
								</div>
							</div>
							<div className="text-[11.5px] text-faint mt-1">
								{t("assignment:detail.specLabel", {
									version: activeVersion.label,
								})}
								{t("assignment:detail.spotCount")}
							</div>
							{shift && (
								<div className="text-[11.5px] font-semibold text-primary-hover mt-1">
									{shiftLabel}（{shift.startTime}–{shift.endTime}）
								</div>
							)}
						</div>
					</div>
					<div className="text-[11.5px] text-muted leading-relaxed border border-border rounded-lg p-3 bg-table-head">
						{t("assignment:detail.help")}
					</div>
				</>
			)}
		</div>
	);
}
