import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: ReactNode;
	label?: string;
	size?: number;
	active?: boolean;
}

export function IconButton({
	children,
	label,
	size = 36,
	active = false,
	className,
	style,
	...rest
}: IconButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			className={`inline-flex items-center justify-center rounded-sm border border-border cursor-pointer transition-colors duration-150 text-base leading-none ${active ? "bg-primary-soft text-primary-hover" : "bg-surface text-muted hover:bg-hairline"}${className ? ` ${className}` : ""}`}
			style={{ width: size, height: size, ...style }}
			{...rest}
		>
			{children}
		</button>
	);
}
