import { useState } from "react";
import { Badge } from "#/components/ui/Badge";
import type { VersionState } from "./types";

type Props = {
	versions: VersionState[];
	currentVersion: VersionState;
	onSelect: (version: VersionState) => void;
};

export function VersionSelector({ versions, currentVersion, onSelect }: Props) {
	const [open, setOpen] = useState(false);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-[7px] border border-border rounded-[9px] px-[11px] py-[6px] cursor-pointer bg-surface hover:bg-hairline"
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
				<>
					<div className="fixed inset-0 z-[29]" onClick={() => setOpen(false)} />
					<div className="absolute top-[40px] right-0 w-[200px] bg-surface border border-border rounded-[11px] shadow-float p-[6px] z-30">
						<div className="text-[10px] font-bold tracking-[.08em] text-faint px-[9px] py-[5px]">
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
								className="w-full flex items-center justify-between gap-2 px-[10px] py-[8px] rounded-[8px] text-[12.5px] font-semibold text-ink hover:bg-hairline cursor-pointer border-none bg-transparent"
							>
								<span>{v.label}</span>
								{v.isActive && <Badge tone="success">使用中</Badge>}
							</button>
						))}
						<div className="h-px bg-hairline mx-1 my-[5px]" />
						<button
							type="button"
							className="w-full text-left px-[10px] py-[8px] rounded-[8px] text-[12.5px] font-bold text-primary hover:bg-hairline cursor-pointer border-none bg-transparent"
						>
							＋ 現在を複製して新バージョン
						</button>
					</div>
				</>
			)}
		</div>
	);
}
