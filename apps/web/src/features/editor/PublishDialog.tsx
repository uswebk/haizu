import { useRef } from "react";
import { Button } from "#/components/ui/Button";
import { useDismiss } from "#/hooks/useDismiss";

type Props = {
	open: boolean;
	isPending: boolean;
	versionLabel: string;
	isLatest: boolean;
	onConfirm: () => void;
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
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)]"
			>
				<div className="px-5.5 py-5 border-b border-hairline">
					<div className="text-base font-bold">規格を公開</div>
					<div className="text-[13px] text-muted mt-1.25">
						{versionLabel}{" "}
						を公開します。配置決め・配置ビュアーではこのバージョンが使用されます。
					</div>
					{!isLatest && (
						<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-3 leading-relaxed">
							{versionLabel}{" "}
							はこのエリアの最新バージョンではないため、公開しても配置決め・配置ビュアーでは使用されません。最新の内容を更新したい場合は、新しいバージョンを作成して編集する必要があります。
						</div>
					)}
				</div>
				<div className="flex justify-end gap-2.5 px-5.5 py-4">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						キャンセル
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{isPending ? "公開中…" : "公開する"}
					</Button>
				</div>
			</div>
		</div>
	);
}
