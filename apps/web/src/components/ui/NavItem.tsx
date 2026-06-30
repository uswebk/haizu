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
			className={`flex items-center gap-2.75 px-3 py-2.5 rounded-[10px] text-[13.5px] cursor-pointer transition-colors duration-150 ${active ? "bg-primary-soft text-primary-hover font-bold" : "bg-transparent text-muted font-medium hover:bg-hairline"}${className ? ` ${className}` : ""}`}
		>
			<span
				className={`w-1.75 h-1.75 rounded-[2px] shrink-0 ${active ? "bg-primary" : "bg-dash"}`}
			/>
			{children}
		</div>
	);
}
