import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useDismiss } from "#/hooks/useDismiss";
import { fetchTags, tagKeys } from "#/lib/api/tags";
import type { EmployeeRow } from "./types";

const AVATAR_COLORS = [
	"#2f8fd6",
	"#3d9970",
	"#f0883e",
	"#8b5cf6",
	"#26a69a",
	"#e85d75",
	"#d4a017",
	"#ef6c5a",
];

export type EmployeeFormValues = {
	lastName: string;
	firstName: string;
	code: string;
	tagIds: string[];
	avatarColor: string;
	isActive: boolean;
};

type Props = {
	open: boolean;
	mode: "create" | "edit";
	initialValue?: EmployeeRow;
	onSubmit: (data: EmployeeFormValues) => void;
	onCancel: () => void;
};

function draftFromProps(
	mode: "create" | "edit",
	initialValue: EmployeeRow | undefined,
): EmployeeFormValues {
	if (mode === "edit" && initialValue) {
		return {
			lastName: initialValue.lastName,
			firstName: initialValue.firstName,
			code: initialValue.code,
			tagIds: initialValue.tags.map((t) => t.id),
			avatarColor: initialValue.avatarColor,
			isActive: initialValue.isActive,
		};
	}
	return {
		lastName: "",
		firstName: "",
		code: "",
		tagIds: [],
		avatarColor: AVATAR_COLORS[0],
		isActive: true,
	};
}

export function EmployeeFormDialog({
	open,
	mode,
	initialValue,
	onSubmit,
	onCancel,
}: Props) {
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	const { data: allTags = [] } = useQuery({
		queryKey: tagKeys.all,
		queryFn: fetchTags,
	});

	const [draft, setDraft] = useState<EmployeeFormValues>(() =>
		draftFromProps(mode, initialValue),
	);

	// ダイアログを開くたびに対象データへ合わせて下書きを作り直す
	useEffect(() => {
		if (open) setDraft(draftFromProps(mode, initialValue));
	}, [open, mode, initialValue]);

	if (!open) return null;

	const toggleTag = (tagId: string) => {
		setDraft((d) => ({
			...d,
			tagIds: d.tagIds.includes(tagId)
				? d.tagIds.filter((t) => t !== tagId)
				: [...d.tagIds, tagId],
		}));
	};

	const canSave =
		draft.lastName.trim().length > 0 && draft.code.trim().length > 0;

	const handleSave = () => {
		if (!canSave) return;
		onSubmit({
			...draft,
			lastName: draft.lastName.trim(),
			firstName: draft.firstName.trim(),
			code: draft.code.trim(),
		});
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-155 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-7"
			>
				<div className="flex items-center gap-4 mb-6">
					<div
						className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0"
						style={{ background: draft.avatarColor }}
					>
						{draft.lastName ? Array.from(draft.lastName)[0] : ""}
					</div>
					<div>
						<div className="text-lg font-bold">
							{mode === "create" ? "従業員を追加" : "従業員を編集"}
						</div>
						<div className="text-xs text-faint mt-0.75">
							基本情報を入力してください
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 mb-4.5">
					<Input
						label="姓"
						value={draft.lastName}
						onChange={(e) =>
							setDraft((d) => ({ ...d, lastName: e.target.value }))
						}
						placeholder="山田"
					/>
					<Input
						label="名"
						value={draft.firstName}
						onChange={(e) =>
							setDraft((d) => ({ ...d, firstName: e.target.value }))
						}
						placeholder="太郎"
					/>
					<Input
						label="社員番号"
						value={draft.code}
						onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
						placeholder="EMP-001"
						className="font-mono"
					/>
				</div>

				<div className="mb-2 text-xs font-semibold text-muted">
					タグ<span className="text-faint font-medium">（複数選択可）</span>
				</div>
				<div className="flex flex-wrap gap-2 mb-4.5">
					{allTags.map((tag) => {
						const on = draft.tagIds.includes(tag.id);
						return (
							<button
								key={tag.id}
								type="button"
								onClick={() => toggleTag(tag.id)}
								className={`text-[12.5px] px-3.25 py-2 rounded-sm border cursor-pointer ${
									on
										? "font-bold border-primary text-primary bg-primary-soft"
										: "font-semibold border-border text-muted bg-surface"
								}`}
							>
								{tag.name}
							</button>
						);
					})}
				</div>

				<div className="mb-2 text-xs font-semibold text-muted">識別カラー</div>
				<div className="flex flex-wrap gap-2.25 mb-5">
					{AVATAR_COLORS.map((color) => (
						<button
							key={color}
							type="button"
							aria-label={`カラー ${color}`}
							onClick={() => setDraft((d) => ({ ...d, avatarColor: color }))}
							className="w-7 h-7 rounded-full cursor-pointer"
							style={{
								background: color,
								boxShadow:
									draft.avatarColor === color
										? "0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-ink)"
										: "none",
							}}
						/>
					))}
				</div>

				<button
					type="button"
					onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
					className="w-full flex items-center justify-between px-3.5 py-3 border border-border rounded-md cursor-pointer mb-6 text-left"
				>
					<div>
						<div className="text-[13.5px] font-semibold">有効</div>
						<div className="text-[11.5px] text-faint">
							配置決めで選択できる状態にします
						</div>
					</div>
					<div
						className="w-11 h-6.5 rounded-pill relative"
						style={{
							background: draft.isActive
								? "var(--color-primary)"
								: "var(--color-hairline)",
						}}
					>
						<div
							className="absolute top-0.75 w-5 h-5 rounded-full bg-white transition-[right,left]"
							style={draft.isActive ? { right: "3px" } : { left: "3px" }}
						/>
					</div>
				</button>

				<div className="flex justify-end gap-2.5">
					<Button variant="secondary" onClick={onCancel}>
						キャンセル
					</Button>
					<Button onClick={handleSave} disabled={!canSave}>
						保存する
					</Button>
				</div>
			</div>
		</div>
	);
}
