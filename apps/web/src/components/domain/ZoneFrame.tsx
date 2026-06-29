import type { HTMLAttributes, ReactNode } from "react";

interface ZoneFrameProps extends HTMLAttributes<HTMLDivElement> {
	label?: string;
	children?: ReactNode;
	width?: number | string;
	height?: number | string;
}

export function ZoneFrame({
	label = "製造ゾーン",
	children,
	width,
	height,
	className,
	style,
	...rest
}: ZoneFrameProps) {
	return (
		<div
			className={`border-[1.6px] border-dashed border-zone rounded-[10px] relative${className ? ` ${className}` : ""}`}
			style={{
				width,
				height: height || (children ? undefined : 74),
				minHeight: children ? 96 : undefined,
				padding: children ? "30px 14px 14px" : 0,
				...style,
			}}
			{...rest}
		>
			<span className="absolute left-2.5 top-2 text-[11px] font-bold text-faint tracking-[.04em]">
				{label}
			</span>
			{children}
		</div>
	);
}
