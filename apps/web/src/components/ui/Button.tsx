import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "sm";

interface ButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	type?: "button" | "submit" | "reset";
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
	md: "text-[13px] px-[18px] py-[10px] rounded-[10px]",
	sm: "text-[12px] px-[13px] py-[9px] rounded-sm",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-white border-0 font-bold enabled:hover:bg-primary-hover",
	secondary:
		"bg-surface text-ink border border-border font-semibold enabled:hover:bg-hairline",
	danger:
		"bg-surface text-danger border border-danger-line font-semibold enabled:hover:bg-danger-soft",
	ghost:
		"bg-transparent text-muted border-0 font-semibold enabled:hover:bg-hairline",
};

export function Button({
	children,
	variant = "primary",
	size = "md",
	disabled = false,
	type = "button",
	className,
	style,
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			className={`font-sans leading-none cursor-pointer transition-colors duration-150 disabled:bg-disabled disabled:text-white disabled:border-0 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]}${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			{children}
		</button>
	);
}
