import { useRef, useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { useDismiss } from "#/hooks/useDismiss";
import type { VersionState } from "./types";

type Props = {
	versions: VersionState[];
	currentVersion: VersionState;
	onSelect: (version: VersionState) => void;
	onDuplicate: () => void;
};

export function VersionSelector({
	versions,
	currentVersion,
	onSelect,
	onDuplicate,
}: Props) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	useDismiss(open, () => setOpen(false), containerRef);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-1.75 border border-border rounded-[9px] px-2.75 py-1.5 cursor-pointer bg-surface hover:bg-hairline"
			>
				<span className="text-[10px] font-bold tracking-[.08em] text-faint">
					VER
				</span>
				<span className="text-[12.5px] font-bold text-primary-hover">
					{currentVersion.label}
				</span>
				<span className="text-faint text-[10px]">▾</span>
			</button>
			{open && (
				<div className="absolute top-10 right-0 w-50 bg-surface border border-border rounded-[11px] shadow-float p-1.5 z-30">
					<div className="text-[10px] font-bold tracking-[.08em] text-faint px-2.25 py-1.25">
						バージョン
					</div>
					{versions.map((v) => (
						<button
							key={v.id}
							type="button"
							onClick={() => {
								onSelect(v);
								setOpen(false);
							}}
							className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm text-[12.5px] font-semibold text-ink hover:bg-hairline cursor-pointer border-none bg-transparent"
						>
							<span>{v.label}</span>
							{v.isCurrent ? (
								<Badge tone="success">使用中</Badge>
							) : v.status === "published" ? (
								<Badge tone="primary">公開済み</Badge>
							) : null}
						</button>
					))}
					<div className="h-px bg-hairline mx-1 my-1.25" />
					<button
						type="button"
						onClick={() => {
							onDuplicate();
							setOpen(false);
						}}
						className="w-full text-left px-2.5 py-2 rounded-sm text-[12.5px] font-bold text-primary hover:bg-hairline cursor-pointer border-none bg-transparent"
					>
						＋ 現在を複製して新バージョン
					</button>
				</div>
			)}
		</div>
	);
}
