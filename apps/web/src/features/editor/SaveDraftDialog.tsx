import { Button } from "#/components/ui/Button";

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
	if (!open) return null;

	const isDraft = status === "draft";

	return (
		<div
			className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60"
			onClick={onCancel}
		>
			<div
				className="w-[420px] max-w-full bg-surface rounded-[16px] shadow-[0_24px_60px_rgba(16,42,67,.3)]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-[22px] py-[20px] border-b border-hairline">
					<div className="text-[16px] font-bold">
						{isDraft ? "下書き保存" : "保存"}
					</div>
					<div className="text-[13px] text-muted mt-[5px]">
						{isDraft
							? "現在のスポット配置を下書きとして保存します。公開はされません。"
							: "現在のスポット配置を保存します。"}
					</div>
				</div>
				<div className="flex justify-end gap-[10px] px-[22px] py-[16px]">
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
