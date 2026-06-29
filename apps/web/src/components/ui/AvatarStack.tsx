import type { HTMLAttributes } from "react";
import { Avatar } from "./Avatar";

export interface Person {
	id: string;
	name: string;
	color?: string;
}

interface AvatarStackProps extends HTMLAttributes<HTMLDivElement> {
	people?: Person[];
	max?: number;
	size?: number;
}

export function AvatarStack({
	people = [],
	max = 4,
	size = 34,
	className,
	style,
	...rest
}: AvatarStackProps) {
	const shown = people.slice(0, max);
	const overflow = people.length - shown.length;
	const overlap = Math.round(size * 0.24);
	return (
		<div
			className={`flex items-center${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			{shown.map((p, i) => (
				<Avatar
					key={p.id}
					name={p.name}
					color={p.color}
					size={size}
					ring
					style={{ marginLeft: i === 0 ? 0 : -overlap }}
				/>
			))}
			{overflow > 0 && (
				<div
					className="rounded-full flex items-center justify-center font-bold shrink-0 bg-hairline text-muted shadow-ring-surface"
					style={{
						width: size,
						height: size,
						fontSize: Math.round(size * 0.35),
						marginLeft: -overlap,
					}}
				>
					+{overflow}
				</div>
			)}
		</div>
	);
}
