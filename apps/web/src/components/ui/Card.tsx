import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title?: ReactNode;
	status?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
	width?: number | string;
}

export function Card({
	title,
	status,
	footer,
	children,
	width,
	className,
	style,
	...rest
}: CardProps) {
	return (
		<div
			className={`bg-surface border border-border rounded-lg p-4.5 shadow-card${className ? ` ${className}` : ""}`}
			style={{ width, ...style }}
			{...rest}
		>
			{(title || status) && (
				<div className="flex justify-between items-center gap-2.5">
					{title && <div className="font-bold text-[15px]">{title}</div>}
					{status}
				</div>
			)}
			{children}
			{footer && (
				<>
					<div className="h-px bg-hairline my-3.5" />
					<div className="text-xs text-faint">{footer}</div>
				</>
			)}
		</div>
	);
}
