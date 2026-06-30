import type { ReactNode, SelectHTMLAttributes } from "react";

export type SelectOption = string | { value: string; label: string };

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: ReactNode;
	options?: SelectOption[];
	width?: number | string;
}

export function Select({
	label,
	value,
	options = [],
	onChange,
	width,
	className,
	style,
	...rest
}: SelectProps) {
	return (
		<label className="block" style={{ width }}>
			{label && (
				<span className="block text-xs font-semibold text-muted mb-1.5">
					{label}
				</span>
			)}
			<div className="relative">
				<select
					value={value}
					onChange={onChange}
					className={`w-full appearance-none font-sans text-[13.5px] pl-3 pr-8 py-2.5 rounded-sm border border-border bg-surface text-ink outline-none cursor-pointer${className ? ` ${className}` : ""}`}
					style={style}
					{...rest}
				>
					{options.map((o) => {
						const val = typeof o === "string" ? o : o.value;
						const lab = typeof o === "string" ? o : o.label;
						return (
							<option key={val} value={val}>
								{lab}
							</option>
						);
					})}
				</select>
				<span className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none text-xs">
					▾
				</span>
			</div>
		</label>
	);
}
