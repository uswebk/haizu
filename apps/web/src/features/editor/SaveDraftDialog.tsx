import { useRef } from "react";
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
						{isDraft ? "下書き保存" : "保存"}
					</div>
					<div className="text-[13px] text-muted mt-1.25">
						{isDraft
							? "現在のスポット配置を下書きとして保存します。公開はされません。"
							: "現在のスポット配置を保存します。"}
					</div>
				</div>
				<div className="flex justify-end gap-2.5 px-5.5 py-4">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						キャンセル
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{isPending ? "保存中…" : "保存する"}
					</Button>
				</div>
			</div>
		</div>
	);
}
