import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "draft" | "primary" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
	draft: "text-muted bg-hairline",
	primary: "text-primary bg-primary-soft",
	success: "text-success bg-success-soft",
	warning: "text-warning bg-warning-soft",
	danger: "text-danger bg-danger-soft",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	children: ReactNode;
	tone?: BadgeTone;
}

export function Badge({
	children,
	tone = "draft",
	className,
	style,
	...rest
}: BadgeProps) {
	return (
		<span
			className={`inline-block text-[11.5px] font-bold px-[11px] py-[5px] rounded-pill leading-none ${TONE_CLASSES[tone]}${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			{children}
		</span>
	);
}
