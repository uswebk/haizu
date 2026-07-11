import type { HTMLAttributes, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title?: ReactNode;
	hint?: ReactNode;
	action?: ReactNode;
	width?: number | string;
}

export function EmptyState({
	title,
	hint,
	action,
	width,
	className,
	style,
	...rest
}: EmptyStateProps) {
	const { t } = useTranslation("common");
	const resolvedTitle = title ?? t("noData");
	return (
		<div
			className={`border-[1.6px] border-dashed border-dash rounded-md p-5.5 text-center bg-empty-bg${className ? ` ${className}` : ""}`}
			style={{ width, ...style }}
			{...rest}
		>
			<div className="text-[13.5px] font-bold text-muted">{resolvedTitle}</div>
			{hint && <div className="text-xs text-faint mt-1">{hint}</div>}
			{action && <div className="mt-3.5">{action}</div>}
		</div>
	);
}
