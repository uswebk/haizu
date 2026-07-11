import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { useDismiss } from "#/hooks/useDismiss";

type Props = {
	open: boolean;
	isPending: boolean;
	versionLabel: string;
	isLatest: boolean;
	onConfirm: (effectiveDate: string) => void;
	onCancel: () => void;
};

export function PublishDialog({
	open,
	isPending,
	versionLabel,
	isLatest,
	onConfirm,
	onCancel,
}: Props) {
	const { t } = useTranslation(["editor", "common"]);
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);
	const [effectiveDate, setEffectiveDate] = useState("");
	const [touched, setTouched] = useState(false);
	const showError = touched && !effectiveDate;

	if (!open) return null;

	const handleConfirm = () => {
		if (!effectiveDate) {
			setTouched(true);
			return;
		}
		onConfirm(effectiveDate);
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]"
			>
				<div className="px-5.5 py-5 border-b border-hairline">
					<div className="text-base font-bold">{t("editor:publishTitle")}</div>
					<div className="text-[13px] text-muted mt-1.25">
						{versionLabel} {t("editor:publishDesc")}
					</div>
					<label className="block mt-3.5">
						<span className="text-[13px] font-bold text-ink">
							{t("editor:effectiveDate")}{" "}
							<span className="text-warning">*</span>
						</span>
						<input
							type="date"
							required
							value={effectiveDate}
							onChange={(e) => {
								setEffectiveDate(e.target.value);
								setTouched(true);
							}}
							onBlur={() => setTouched(true)}
							className={`mt-1.5 w-full border rounded-md px-3.5 py-2.5 text-[15px] bg-surface outline-none ${
								showError
									? "border-warning"
									: "border-border focus:border-primary"
							}`}
						/>
						{showError && (
							<div className="text-[12px] text-warning mt-1.25">
								{t("editor:effectiveDateRequired")}
							</div>
						)}
					</label>
					{!isLatest && (
						<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-3 leading-relaxed">
							{versionLabel} {t("editor:notLatestWarn")}
						</div>
					)}
				</div>
				<div className="flex justify-end gap-2.5 px-5.5 py-4">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={handleConfirm} disabled={isPending}>
						{isPending ? t("editor:publishing") : t("editor:publish")}
					</Button>
				</div>
			</div>
		</div>
	);
}
