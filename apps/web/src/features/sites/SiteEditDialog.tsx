import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";

export type SiteEditState =
	| { mode: "new" }
	| {
			mode: "edit";
			id: string;
			name: string;
			description: string;
			isActive: boolean;
	  };

type SiteEditInput = { name: string; description: string; isActive: boolean };

export function SiteEditDialog({
	state,
	canDeactivate,
	onCancel,
	onSubmit,
}: {
	state: SiteEditState;
	canDeactivate: boolean;
	onCancel: () => void;
	onSubmit: (input: SiteEditInput) => void;
}) {
	const { t } = useTranslation(["sites", "common"]);
	const isNew = state.mode === "new";
	const [name, setName] = useState(isNew ? "" : state.name);
	const [description, setDescription] = useState(
		isNew ? "" : state.description,
	);
	const [isActive, setIsActive] = useState(isNew ? true : state.isActive);

	const submit = () => {
		if (!name.trim()) return;
		onSubmit({ name, description, isActive });
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div className="w-110 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]">
				<div className="flex items-center justify-between px-5.5 pt-5 pb-1">
					<div className="text-base font-bold">
						{isNew ? t("sites:dialog.addTitle") : t("sites:dialog.editTitle")}
					</div>
					<button
						type="button"
						onClick={onCancel}
						aria-label={t("common:close")}
						className="w-7 h-7 rounded-full bg-app-bg text-faint flex items-center justify-center cursor-pointer border-none text-sm"
					>
						×
					</button>
				</div>

				<div className="px-5.5 py-4 flex flex-col gap-4">
					<div>
						<div className="text-xs font-semibold text-muted mb-1.5">
							{t("sites:dialog.name")}
						</div>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("sites:dialog.namePlaceholder")}
							maxLength={30}
							autoFocus
						/>
					</div>

					<div>
						<div className="text-xs font-semibold text-muted mb-1.5">
							{t("sites:dialog.description")}
						</div>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							placeholder={t("sites:dialog.descriptionPlaceholder")}
							className="w-full font-sans text-[13.5px] px-3 py-2.5 rounded-sm border border-border bg-surface text-ink outline-none resize-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary-soft"
						/>
					</div>

					<div className="flex items-center justify-between gap-3 border border-border rounded-[11px] px-3.75 py-3.25">
						<div>
							<div className="text-[13.5px] font-bold text-ink">
								{t("sites:dialog.activate")}
							</div>
							<div className="text-[11.5px] text-faint mt-0.5">
								{t("sites:dialog.activateHint")}
							</div>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={isActive}
							disabled={isActive && !canDeactivate}
							onClick={() => setIsActive((v) => !v)}
							className={`shrink-0 w-11.5 h-6.5 rounded-pill p-[3px] flex items-center transition-colors duration-150 cursor-pointer border-none disabled:cursor-not-allowed ${
								isActive ? "bg-primary justify-end" : "bg-border justify-start"
							}`}
						>
							<span className="w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(16,42,67,.3)]" />
						</button>
					</div>
				</div>

				<div className="flex justify-end gap-2.5 px-5.5 pb-5.5">
					<Button variant="secondary" onClick={onCancel}>
						{t("common:cancel")}
					</Button>
					<Button onClick={submit} disabled={!name.trim()}>
						{t("sites:dialog.save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
