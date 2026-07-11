import type { HTMLAttributes, ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type Role = "admin" | "site" | "general" | "other";

const ROLE_CLASSES: Record<Role, string> = {
	admin: "text-white bg-ink font-bold border-0",
	site: "text-primary bg-primary-soft font-bold border-0",
	general: "text-muted bg-hairline font-bold border-0",
	other: "text-faint bg-surface font-semibold border border-border",
};

interface RoleBadgeProps extends HTMLAttributes<HTMLSpanElement> {
	role?: Role;
	children?: ReactNode;
}

export function RoleBadge({
	role = "general",
	children,
	className,
	style,
	...rest
}: RoleBadgeProps) {
	const { t } = useTranslation("roleBadge");
	const classes = ROLE_CLASSES[role] || ROLE_CLASSES.general;
	return (
		<span
			className={`inline-block text-xs px-3 py-1.5 rounded-[7px] leading-none ${classes}${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			{children || t(role)}
		</span>
	);
}
