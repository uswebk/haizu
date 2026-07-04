import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PagerButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: ReactNode;
}

export function PagerButton({
	children,
	disabled = false,
	className,
	...rest
}: PagerButtonProps) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={`text-xs font-bold px-2.75 py-1.25 rounded-sm border border-slot-border text-ink bg-surface cursor-pointer transition-colors duration-150 enabled:hover:bg-app-bg disabled:opacity-35 disabled:cursor-not-allowed${className ? ` ${className}` : ""}`}
			{...rest}
		>
			{children}
		</button>
	);
}
