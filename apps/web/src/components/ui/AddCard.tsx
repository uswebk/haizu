import type { ButtonHTMLAttributes } from "react";

interface AddCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	label: string;
}

export function AddCard({ label, className, ...rest }: AddCardProps) {
	return (
		<button
			type="button"
			className={`group min-h-40 flex flex-col items-center justify-center gap-2.5 rounded-section border-[1.6px] border-dashed border-slot-border bg-empty-bg px-6 py-6 text-center cursor-pointer transition-colors duration-150 hover:border-primary hover:bg-primary-soft${className ? ` ${className}` : ""}`}
			{...rest}
		>
			<span className="w-10.5 h-10.5 rounded-full flex items-center justify-center text-xl font-normal bg-surface border border-border text-faint transition-colors duration-150 group-hover:bg-primary group-hover:text-white group-hover:border-primary">
				＋
			</span>
			<span className="text-[13.5px] font-bold text-muted group-hover:text-primary-hover">
				{label}
			</span>
		</button>
	);
}
