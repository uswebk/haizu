import type { HTMLAttributes, ReactNode } from "react";

export type Role = "admin" | "site" | "general" | "other";

const ROLE_META: Record<Role, { label: string; classes: string }> = {
	admin: {
		label: "管理者",
		classes: "text-white bg-ink font-bold border-0",
	},
	site: {
		label: "拠点管理者",
		classes: "text-primary bg-primary-soft font-bold border-0",
	},
	general: {
		label: "一般",
		classes: "text-muted bg-hairline font-bold border-0",
	},
	other: {
		label: "その他",
		classes: "text-faint bg-surface font-semibold border border-border",
	},
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
	const r = ROLE_META[role] || ROLE_META.general;
	return (
		<span
			className={`inline-block text-xs px-3 py-1.5 rounded-[7px] leading-none ${r.classes}${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			{children || r.label}
		</span>
	);
}
