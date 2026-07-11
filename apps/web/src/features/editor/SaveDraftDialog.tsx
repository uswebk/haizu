import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { useDismiss } from "#/hooks/useDismiss";

type Props = {
	open: boolean;
	isPending: boolean;
	status: "draft" | "published";
	onConfirm: () => void;
	onCancel: () => void;
};

export function SaveDraftDialog({
	open,
	isPending,
	status,
	onConfirm,
	onCancel,
}: Props) {
	const { t } = useTranslation(["editor", "common"]);
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	if (!open) return null;

	const isDraft = status === "draft";

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]"
			>
				<div className="px-5.5 py-5 border-b border-hairline">
					<div className="text-base font-bold">
						{isDraft ? t("editor:saveDraft") : t("common:save")}
					</div>
					<div className="text-[13px] text-muted mt-1.25">
						{isDraft ? t("editor:saveDraftDesc") : t("editor:saveDesc")}
					</div>
				</div>
				<div className="flex justify-end gap-2.5 px-5.5 py-4">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{isPending ? t("editor:saving") : t("common:save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
