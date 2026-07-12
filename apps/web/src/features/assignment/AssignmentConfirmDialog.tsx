import type { AssignmentStatus, Shift } from "@haizu/shared";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { formatDateLabel } from "#/lib/datetime";

type Props = {
	action: AssignmentStatus;
	date: string;
	shiftLabel: string;
	shift: Shift | undefined;
	areaName: string;
	assignedCount: number;
	totalCount: number;
	pending: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export function AssignmentConfirmDialog({
	action,
	date,
	shiftLabel,
	shift,
	areaName,
	assignedCount,
	totalCount,
	pending,
	onCancel,
	onConfirm,
}: Props) {
	const { t } = useTranslation(["assignment", "editor", "common"]);
	const isConfirm = action === "confirmed";

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
				<div className="text-base font-bold mb-2">
					{isConfirm
						? t("assignment:detail.confirmTitle")
						: t("assignment:detail.saveDraftTitle")}
				</div>
				<div className="text-[13.5px] text-muted leading-relaxed">
					{isConfirm
						? t("assignment:detail.confirmBody")
						: t("assignment:detail.saveDraftBody")}
				</div>
				<dl className="mt-4 border border-border rounded-lg divide-y divide-border">
					<SummaryRow
						label={t("assignment:detail.dialogDate")}
						value={formatDateLabel(date)}
					/>
					<SummaryRow
						label={t("assignment:detail.dialogShift")}
						value={
							shift
								? `${shiftLabel}（${shift.startTime}–${shift.endTime}）`
								: shiftLabel
						}
					/>
					<SummaryRow
						label={t("assignment:detail.dialogArea")}
						value={areaName}
					/>
					<SummaryRow
						label={t("assignment:detail.dialogPlaced")}
						value={`${assignedCount} / ${totalCount}`}
					/>
				</dl>
				<div className="flex justify-end gap-2.5 mt-6">
					<Button variant="secondary" onClick={onCancel} disabled={pending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={onConfirm} disabled={pending}>
						{pending
							? t("editor:saving")
							: isConfirm
								? t("assignment:detail.confirm")
								: t("common:save")}
					</Button>
				</div>
			</div>
		</div>
	);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
			<dt className="text-[11.5px] font-bold text-faint shrink-0">{label}</dt>
			<dd className="text-[13px] font-semibold text-ink text-right">{value}</dd>
		</div>
	);
}
