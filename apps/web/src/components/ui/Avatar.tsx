import type { HTMLAttributes } from "react";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
	name?: string;
	initial?: string;
	color?: string;
	size?: number;
	ring?: boolean;
}

export function Avatar({
	name = "",
	initial,
	color = "var(--color-faint)",
	size = 40,
	ring = false,
	className,
	style,
	...rest
}: AvatarProps) {
	const ch = initial != null ? initial : name ? Array.from(name)[0] : "";
	return (
		<div
			title={name || undefined}
			className={`rounded-full flex items-center justify-center font-bold shrink-0 text-white${ring ? " shadow-ring-surface" : ""}${className ? ` ${className}` : ""}`}
			style={{
				width: size,
				height: size,
				fontSize: Math.round(size * 0.4),
				background: color,
				...style,
			}}
			{...rest}
		>
			{ch}
		</div>
	);
}
