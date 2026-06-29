import type { HTMLAttributes, ReactNode } from "react";

interface EmptyStateProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title?: ReactNode;
	hint?: ReactNode;
	action?: ReactNode;
	width?: number | string;
}

export function EmptyState({
	title = "データがありません",
	hint,
	action,
	width,
	className,
	style,
	...rest
}: EmptyStateProps) {
	return (
		<div
			className={`border-[1.6px] border-dashed border-dash rounded-md p-[22px] text-center bg-empty-bg${className ? ` ${className}` : ""}`}
			style={{ width, ...style }}
			{...rest}
		>
			<div className="text-[13.5px] font-bold text-muted">{title}</div>
			{hint && <div className="text-[12px] text-faint mt-1">{hint}</div>}
			{action && <div className="mt-[14px]">{action}</div>}
		</div>
	);
}
