import { type InputHTMLAttributes, type ReactNode, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: ReactNode;
	width?: number | string;
}

export function Input({
	label,
	value,
	defaultValue,
	placeholder,
	onChange,
	width,
	className,
	style,
	...rest
}: InputProps) {
	const inputId = useId();
	const field = (
		<input
			id={inputId}
			value={value}
			defaultValue={defaultValue}
			placeholder={placeholder}
			onChange={onChange}
			className={`w-full font-sans text-[13.5px] px-3 py-2.5 rounded-sm border border-border bg-surface text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary-soft${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		/>
	);

	if (!label) return <div style={{ width }}>{field}</div>;
	return (
		<div style={{ width }}>
			<label
				htmlFor={inputId}
				className="block text-xs font-semibold text-muted mb-1.5"
			>
				{label}
			</label>
			{field}
		</div>
	);
}
