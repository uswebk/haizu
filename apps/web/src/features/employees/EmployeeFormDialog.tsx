import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useDismiss } from "#/hooks/useDismiss";
import { fetchTags, tagKeys } from "#/lib/api/tags";
import { AVATAR_COLORS } from "./palette";
import type { EmployeeRow } from "./types";

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
	isPending?: boolean;
	errorMessage?: string | null;
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
	isPending = false,
	errorMessage,
	onSubmit,
	onCancel,
}: Props) {
	const { t } = useTranslation(["employees", "members", "common"]);
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
							{mode === "create"
								? t("employees:dialog.createTitle")
								: t("employees:dialog.editTitle")}
						</div>
						<div className="text-xs text-faint mt-0.75">
							{t("employees:dialog.subtitle")}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 mb-4.5">
					<Input
						label={t("members:form.lastName")}
						value={draft.lastName}
						onChange={(e) =>
							setDraft((d) => ({ ...d, lastName: e.target.value }))
						}
						placeholder={t("members:form.lastNamePlaceholder")}
					/>
					<Input
						label={t("members:form.firstName")}
						value={draft.firstName}
						onChange={(e) =>
							setDraft((d) => ({ ...d, firstName: e.target.value }))
						}
						placeholder={t("employees:dialog.firstNamePlaceholder")}
					/>
					<Input
						label={t("employees:colCode")}
						value={draft.code}
						onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
						placeholder="EMP-001"
						className="font-mono"
					/>
				</div>

				<div className="mb-2 text-xs font-semibold text-muted">
					{t("employees:colTags")}
					<span className="text-faint font-medium">
						{t("employees:dialog.multiSelect")}
					</span>
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

				<div className="mb-2 text-xs font-semibold text-muted">
					{t("employees:dialog.identColor")}
				</div>
				<div className="flex flex-wrap gap-2.25 mb-5">
					{AVATAR_COLORS.map((color) => (
						<button
							key={color}
							type="button"
							aria-label={t("employees:dialog.colorAria", { color })}
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
						<div className="text-[13.5px] font-semibold">
							{t("employees:active")}
						</div>
						<div className="text-[11.5px] text-faint">
							{t("employees:dialog.activeHint")}
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

				{errorMessage && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mb-4 leading-relaxed">
						{errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2.5">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={handleSave} disabled={!canSave || isPending}>
						{isPending ? t("members:form.saving") : t("members:form.save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
