import { useRef, useState } from "react";
import { useDismiss } from "#/hooks/useDismiss";
import type { ShiftOption } from "./shift";

type Props = {
	date: string;
	onDateChange: (date: string) => void;
	shiftId: string | null;
	shiftLabel: string;
	options: ShiftOption[];
	onShiftChange: (shiftId: string) => void;
};

export function ShiftDatePicker({
	date,
	onDateChange,
	shiftId,
	shiftLabel,
	options,
	onShiftChange,
}: Props) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	useDismiss(open, () => setOpen(false), menuRef);

	return (
		<div className="flex items-center gap-2">
			<input
				type="date"
				value={date}
				onChange={(e) => onDateChange(e.target.value)}
				className="font-sans text-xs font-bold text-ink border border-border rounded-md px-3 py-1.75 bg-surface outline-none"
			/>
			<div ref={menuRef} className="relative">
				<button
					type="button"
					onClick={() => options.length > 0 && setOpen((v) => !v)}
					className="flex items-center gap-1.75 border border-border rounded-md px-3.25 py-2 bg-surface cursor-pointer disabled:cursor-default"
					disabled={options.length === 0}
				>
					<span className="text-xs font-bold text-primary">{shiftLabel}</span>
					{options.length > 0 && (
						<span className="text-faint text-[10px]">▾</span>
					)}
				</button>
				{open && (
					<div className="absolute top-10 right-0 w-37.5 bg-surface border border-border rounded-lg shadow-float p-1.5 z-30">
						<div className="text-[10px] font-bold tracking-wide text-faint px-2.25 pt-1.25 pb-1.75">
							交代
						</div>
						{options.map((o) => (
							<button
								key={o.id}
								type="button"
								onClick={() => {
									onShiftChange(o.id);
									setOpen(false);
								}}
								className={`w-full text-left text-xs px-2.75 py-2 rounded-sm cursor-pointer ${
									o.id === shiftId
										? "font-bold text-primary-hover bg-primary-soft"
										: "font-medium text-ink hover:bg-app-bg"
								}`}
							>
								{o.name}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
