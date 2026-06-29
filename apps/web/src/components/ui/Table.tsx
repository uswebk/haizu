import type { HTMLAttributes, ReactNode } from "react";

export interface TableColumn<Row> {
	key: string;
	label: ReactNode;
	width?: string;
	muted?: boolean;
	render?: (row: Row) => ReactNode;
}

interface TableProps<Row> extends HTMLAttributes<HTMLDivElement> {
	columns?: TableColumn<Row>[];
	rows?: Row[];
}

export function Table<Row>({
	columns = [],
	rows = [],
	className,
	style,
	...rest
}: TableProps<Row>) {
	const template = columns.map((c) => c.width || "1fr").join(" ");
	return (
		<div
			className={`border border-border rounded-md overflow-hidden${className ? ` ${className}` : ""}`}
			style={style}
			{...rest}
		>
			<div
				className="grid bg-table-head px-[18px] py-[11px] text-[11.5px] font-bold text-faint tracking-[.04em] gap-3"
				style={{ gridTemplateColumns: template }}
			>
				{columns.map((c) => (
					<div key={c.key}>{c.label}</div>
				))}
			</div>
			{rows.map((row, ri) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional sample data
					key={ri}
					className="grid items-center px-[18px] py-[13px] border-t border-hairline text-[13.5px] gap-3"
					style={{ gridTemplateColumns: template }}
				>
					{columns.map((c) => (
						<div key={c.key} className={c.muted ? "text-muted" : "text-ink"}>
							{c.render
								? c.render(row)
								: ((row as Record<string, ReactNode>)[c.key] as ReactNode)}
						</div>
					))}
				</div>
			))}
		</div>
	);
}
