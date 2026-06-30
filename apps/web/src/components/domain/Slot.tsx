import type { HTMLAttributes } from "react";
import { AvatarStack, type Person } from "#/components/ui";

interface SlotProps extends HTMLAttributes<HTMLDivElement> {
	title?: string;
	capacity?: number;
	people?: Person[];
	width?: number | string;
}

export function Slot({
	title = "",
	capacity = 4,
	people = [],
	width = 172,
	className,
	style,
	...rest
}: SlotProps) {
	const assigned = people.length > 0;
	if (!assigned) {
		return (
			<div
				className={`border-[1.6px] border-dashed border-dash rounded-[10px] flex items-center justify-center text-faint text-[12.5px] font-semibold h-18.5${className ? ` ${className}` : ""}`}
				style={{ width, ...style }}
				{...rest}
			>
				＋ 未割当
			</div>
		);
	}
	return (
		<div
			className={`bg-surface border border-slot-border rounded-[10px] p-2.75 shadow-card-strong${className ? ` ${className}` : ""}`}
			style={{ width, ...style }}
			{...rest}
		>
			<div className="text-[13px] font-bold">{title}</div>
			<div className="text-[11px] text-muted mt-px">
				定員{capacity} ・ 配置{people.length}
			</div>
			<div className="mt-2.5">
				<AvatarStack people={people} max={5} size={26} />
			</div>
		</div>
	);
}
