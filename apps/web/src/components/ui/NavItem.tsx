import type { ReactNode } from "react";

interface NavItemProps {
	children: ReactNode;
	active?: boolean;
	className?: string;
}

export function NavItem({ children, active = false, className }: NavItemProps) {
	return (
		<div
			data-active={active}
			className={`flex items-center gap-[11px] px-3 py-[10px] rounded-[10px] text-[13.5px] cursor-pointer transition-colors duration-150 ${active ? "bg-primary-soft text-primary-hover font-bold" : "bg-transparent text-muted font-medium hover:bg-hairline"}${className ? ` ${className}` : ""}`}
		>
			<span
				className={`w-[7px] h-[7px] rounded-[2px] shrink-0 ${active ? "bg-primary" : "bg-dash"}`}
			/>
			{children}
		</div>
	);
}
