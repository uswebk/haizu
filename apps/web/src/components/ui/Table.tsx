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
	rowKey?: (row: Row, index: number) => string | number;
}

export function Table<Row>({
	columns = [],
	rows = [],
	rowKey,
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
				className="grid bg-table-head px-4.5 py-2.75 text-[11.5px] font-bold text-faint tracking-[.04em] gap-3"
				style={{ gridTemplateColumns: template }}
			>
				{columns.map((c) => (
					<div key={c.key}>{c.label}</div>
				))}
			</div>
			{rows.map((row, ri) => (
				<div
					key={rowKey ? rowKey(row, ri) : ri}
					className="grid items-center px-4.5 py-3.25 border-t border-hairline text-[13.5px] gap-3"
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
