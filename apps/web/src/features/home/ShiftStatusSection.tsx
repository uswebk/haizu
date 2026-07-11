import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { formatDateLabel } from "#/lib/datetime";
import type { ShiftSlot, ShiftStatus } from "./shiftCycle";

type Variant = "current" | "next" | "previous";

type Props = {
	variant: Variant;
	slot: ShiftSlot;
	status: ShiftStatus;
	siteId: string;
};

const badgeTone: Record<Variant, string> = {
	current: "text-primary-hover bg-primary-soft",
	next: "text-muted bg-hairline",
	previous: "text-faint bg-empty-bg",
};

export function ShiftStatusSection({ variant, slot, status, siteId }: Props) {
	const { t } = useTranslation(["home", "common"]);
	const { shift, date } = slot;

	const badgeLabel =
		variant === "current"
			? t("home:currentShift")
			: variant === "next"
				? t("home:nextShift")
				: t("home:previousShift");
	const shiftName = shift
		? `${shift.name} ${shift.startTime}〜${shift.endTime}`
		: t("home:allDay");

	const header = (
		<div className="flex items-center gap-2.5 min-w-0">
			<span
				className={`flex-none text-[11px] font-bold px-2 py-0.5 rounded-pill ${badgeTone[variant]}`}
			>
				{badgeLabel}
			</span>
			<div className="min-w-0">
				<div className="font-bold text-[15px] text-ink truncate">
					{shiftName}
				</div>
				<div className="text-[11.5px] text-faint font-medium">
					{formatDateLabel(date)}
				</div>
			</div>
			<span className="flex-none text-[13px] font-bold text-faint">
				{t("home:placedAreasShort", {
					placed: status.placedAreaCount,
					total: status.publishedCount,
				})}
			</span>
		</div>
	);

	// Previous shift: collapsed by default, no links to unplaced areas.
	if (variant === "previous") {
		return (
			<details className="mt-4 bg-surface border border-border rounded-lg shadow-card overflow-hidden">
				<summary className="flex items-center justify-between gap-3 px-4.5 py-3.5 cursor-pointer list-none">
					{header}
					<span className="flex-none text-[13px] font-bold text-muted">
						{t("home:placementRate", { pct: status.placementPct })}
					</span>
				</summary>
				<div className="px-4.5 pb-4 pt-1">
					<ProgressBar pct={status.placementPct} />
					{status.unplacedAreas.length > 0 ? (
						<ul className="mt-3 flex flex-col gap-1.5">
							{status.unplacedAreas.map((area) => (
								<li
									key={area.id}
									className="flex items-center gap-2.5 text-[13px]"
								>
									<span className="font-bold text-muted truncate">
										{area.name}
									</span>
									<span
										className={`flex-none text-[11px] font-bold px-2 py-0.5 rounded-pill ${
											status.draftAreaIds.has(area.id)
												? "text-warning bg-warning-soft"
												: "text-faint bg-empty-bg"
										}`}
									>
										{status.draftAreaIds.has(area.id)
											? t("home:hasDraft")
											: t("home:notStarted")}
									</span>
								</li>
							))}
						</ul>
					) : (
						<div className="mt-3 text-[13px] text-faint">
							{t("home:allPlacedShift")}
						</div>
					)}
				</div>
			</details>
		);
	}

	const large = variant === "current";

	return (
		<div className="mt-4 bg-surface border border-border rounded-lg shadow-card overflow-hidden">
			<div
				className={`flex items-center justify-between gap-3 px-4.5 border-b border-border ${
					large ? "py-4" : "py-3.5"
				}`}
			>
				{header}
				<span className="flex-none text-[13px] font-bold text-muted">
					{t("home:placementRate", { pct: status.placementPct })}
				</span>
			</div>
			<div className={large ? "p-4.5" : "px-4.5 py-3.5"}>
				<ProgressBar
					pct={status.placementPct}
					full={status.unplacedAreaCount === 0 && status.publishedCount > 0}
				/>
				{large && (
					<div className="mt-3.5 flex gap-6">
						<Stat
							label={t("home:placedPeople")}
							value={String(status.assignedCount)}
							unit={t("home:personUnit")}
						/>
						<Stat
							label={t("home:openSpots")}
							value={String(status.openSpots)}
							unit={t("home:totalSpots", { count: status.totalSpots })}
						/>
					</div>
				)}
				{status.unplacedAreas.length > 0 ? (
					<ul className="mt-3.5 flex flex-col gap-1.5">
						{status.unplacedAreas.map((area) => (
							<li key={area.id}>
								<Link
									to="/s/$siteId/assignment/$areaId"
									params={{ siteId, areaId: area.id }}
									search={{ date, shiftId: shift?.id }}
									className="flex items-center gap-2.5 px-3 py-2 -mx-1 rounded-md hover:bg-hairline transition-colors duration-150"
								>
									<span className="font-bold text-[14px] text-ink min-w-0 truncate">
										{area.name}
									</span>
									<span
										className={`flex-none text-[11px] font-bold px-2 py-0.5 rounded-pill ${
											status.draftAreaIds.has(area.id)
												? "text-warning bg-warning-soft"
												: "text-faint bg-empty-bg"
										}`}
									>
										{status.draftAreaIds.has(area.id)
											? t("home:hasDraft")
											: t("home:notStarted")}
									</span>
									<span className="ml-auto flex-none text-[13px] font-bold text-primary">
										{t("home:place")}
									</span>
								</Link>
							</li>
						))}
					</ul>
				) : (
					<div className="mt-3 text-[13px] text-faint">
						{t("home:allPlacedShift")}
					</div>
				)}
			</div>
		</div>
	);
}

function ProgressBar({ pct, full }: { pct: number; full?: boolean }) {
	return (
		<div className="h-1.75 rounded-pill bg-hairline overflow-hidden">
			<div
				className="h-full rounded-pill"
				style={{
					width: `${pct}%`,
					background: full ? "var(--color-success)" : "var(--color-primary)",
				}}
			/>
		</div>
	);
}

function Stat({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit?: string;
}) {
	return (
		<div>
			<div className="text-[12px] text-muted">{label}</div>
			<div className="mt-1 flex items-baseline gap-1">
				<span className="text-2xl font-bold text-ink">{value}</span>
				{unit && <span className="text-[12px] text-faint">{unit}</span>}
			</div>
		</div>
	);
}
