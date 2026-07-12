import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "#/components/ui/Avatar";
import type { EmployeeRow } from "#/features/employees/types";
import { useDismiss } from "#/hooks/useDismiss";

type Props = {
	employees: EmployeeRow[];
	assignedIds: Set<string>;
	selectedSpot: string | null;
	dragId: React.MutableRefObject<string | null>;
	onAssignToSelected: (empId: string) => void;
	onDropToPool: (e: React.DragEvent) => void;
};

export function AssignmentPool({
	employees,
	assignedIds,
	selectedSpot,
	dragId,
	onAssignToSelected,
	onDropToPool,
}: Props) {
	const { t } = useTranslation(["assignment"]);
	const [poolSearch, setPoolSearch] = useState("");
	const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
	const [tagMenuOpen, setTagMenuOpen] = useState(false);
	const [tagSearch, setTagSearch] = useState("");
	const tagMenuRef = useRef<HTMLDivElement>(null);
	const closeTagMenu = () => {
		setTagMenuOpen(false);
		setTagSearch("");
	};
	useDismiss(tagMenuOpen, closeTagMenu, tagMenuRef);

	const tagOptions = useMemo(() => {
		const m = new Map<string, string>();
		for (const e of employees) {
			for (const tag of e.tags) m.set(tag.id, tag.name);
		}
		return [...m].map(([id, name]) => ({ id, name }));
	}, [employees]);
	const filteredTagOptions = tagOptions.filter((tag) =>
		tag.name.includes(tagSearch.trim()),
	);

	const toggleTag = (tagId: string) =>
		setTagFilter((prev) => {
			const next = new Set(prev);
			if (next.has(tagId)) next.delete(tagId);
			else next.add(tagId);
			return next;
		});

	const pool = employees.filter((e) => {
		if (assignedIds.has(e.id)) return false;
		if (tagFilter.size > 0 && !e.tags.some((tag) => tagFilter.has(tag.id)))
			return false;
		const q = poolSearch.trim();
		if (!q) return true;
		return `${e.lastName}${e.firstName}${e.code}`.includes(q);
	});

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: drop area for the unplaced pool
		<div
			onDragOver={(e) => e.preventDefault()}
			onDrop={onDropToPool}
			className="w-53.5 shrink-0 flex flex-col border-r border-border p-3.5"
		>
			<div className="flex items-baseline justify-between mb-2.5">
				<div className="text-[13px] font-bold">
					{t("assignment:detail.unplacedEmployees")}
				</div>
				<div className="text-[10.5px] font-bold text-warning bg-warning-soft px-2 py-0.75 rounded-pill">
					{pool.length}
				</div>
			</div>
			<input
				value={poolSearch}
				onChange={(e) => setPoolSearch(e.target.value)}
				placeholder={t("assignment:detail.searchByName")}
				className="w-full font-sans text-xs px-2.75 py-2 rounded-sm border border-border bg-surface outline-none"
			/>
			{tagOptions.length > 0 && (
				<div className="relative mt-2" ref={tagMenuRef}>
					<button
						type="button"
						onClick={() => setTagMenuOpen((v) => !v)}
						className="w-full flex items-center justify-between gap-1.5 border border-border rounded-sm px-2.75 py-2 bg-surface text-xs font-bold text-ink cursor-pointer hover:bg-hairline"
					>
						<span>
							{t("assignment:detail.filterByTag")}
							{tagFilter.size > 0 && (
								<span className="text-primary-hover ml-1">
									（{tagFilter.size}）
								</span>
							)}
						</span>
						<span className="text-faint text-[10px]">▾</span>
					</button>
					{tagMenuOpen && (
						<div className="absolute top-9.5 left-0 right-0 bg-surface border border-border rounded-[9px] shadow-float p-1.5 z-30">
							<input
								value={tagSearch}
								onChange={(e) => setTagSearch(e.target.value)}
								placeholder={t("assignment:detail.searchTagName")}
								className="w-full font-sans text-xs px-2.25 py-1.75 rounded-sm border border-border bg-surface outline-none mb-1.25"
							/>
							<div className="max-h-48 overflow-auto flex flex-col gap-0.5">
								{filteredTagOptions.length === 0 ? (
									<div className="text-[11.5px] text-faint text-center py-2.5">
										{t("assignment:detail.noMatchingTags")}
									</div>
								) : (
									filteredTagOptions.map((tag) => {
										const active = tagFilter.has(tag.id);
										return (
											<button
												key={tag.id}
												type="button"
												onClick={() => toggleTag(tag.id)}
												className="w-full flex items-center gap-2 px-2.25 py-1.75 rounded-sm text-[12.5px] font-semibold text-ink hover:bg-hairline cursor-pointer border-none bg-transparent"
											>
												<span
													className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 text-[10px] ${
														active
															? "bg-primary border-primary text-white"
															: "border-border"
													}`}
												>
													{active && "✓"}
												</span>
												{tag.name}
											</button>
										);
									})
								)}
							</div>
						</div>
					)}
				</div>
			)}
			{tagFilter.size > 0 && (
				<div className="flex flex-wrap gap-1 mt-1.5">
					{[...tagFilter].map((id) => {
						const name = tagOptions.find((tag) => tag.id === id)?.name ?? "";
						return (
							<button
								key={id}
								type="button"
								onClick={() => toggleTag(id)}
								className="text-[10.5px] font-bold text-primary-hover bg-primary-soft px-2 py-0.75 rounded-pill cursor-pointer border-none"
							>
								{name} ×
							</button>
						);
					})}
				</div>
			)}
			<div className="flex flex-col gap-1.75 mt-2.75 overflow-auto">
				{pool.map((e) => (
					<button
						key={e.id}
						type="button"
						draggable
						onDragStart={() => {
							dragId.current = e.id;
						}}
						onClick={() => {
							if (selectedSpot) onAssignToSelected(e.id);
						}}
						className={`flex items-center gap-2.5 p-1.75 rounded-md border text-left ${
							selectedSpot
								? "border-primary-soft-bd bg-primary-soft/40 cursor-pointer"
								: "border-border bg-surface cursor-grab"
						}`}
					>
						<Avatar name={e.lastName} color={e.avatarColor} size={28} />
						<div className="min-w-0">
							<div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
								{e.lastName} {e.firstName}
							</div>
							<div className="text-[11px] text-faint">
								{e.tags[0]?.name ?? ""}
							</div>
						</div>
					</button>
				))}
			</div>
			<div className="mt-2.5 text-[10.5px] text-faint leading-relaxed text-center">
				{t("assignment:detail.dragHere1")}
				<br />
				{t("assignment:detail.dragHere2")}
			</div>
		</div>
	);
}
