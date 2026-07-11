import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Table, type TableColumn } from "#/components/ui/Table";
import { useDismiss } from "#/hooks/useDismiss";
import type { ImportPreview, PreviewRow } from "./importValidation";

type Props = {
	open: boolean;
	preview: ImportPreview | null;
	fileName: string;
	isPending: boolean;
	errorMessage?: string | null;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ImportPreviewDialog({
	open,
	preview,
	fileName,
	isPending,
	errorMessage,
	onConfirm,
	onCancel,
}: Props) {
	const { t } = useTranslation(["employees", "common"]);
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	const columns: TableColumn<PreviewRow>[] = [
		{
			key: "status",
			label: t("employees:import.colResult"),
			width: "0.7fr",
			render: (r) => (
				<Badge tone={r.errors.length === 0 ? "success" : "warning"}>
					{r.errors.length === 0
						? t("employees:import.ok")
						: t("employees:import.error")}
				</Badge>
			),
		},
		{
			key: "code",
			label: t("employees:colCode"),
			width: "1fr",
			render: (r) => <span className="font-mono text-xs">{r.code || "—"}</span>,
		},
		{
			key: "name",
			label: t("employees:import.colName"),
			width: "1fr",
			render: (r) => <span className="font-semibold">{r.name || "—"}</span>,
		},
		{
			key: "tags",
			label: t("employees:colTags"),
			width: "1.4fr",
			render: (r) => (
				<div className="flex flex-wrap gap-1.25">
					{r.tagNames.map((name) => (
						<Badge key={name} tone="primary">
							{name}
						</Badge>
					))}
				</div>
			),
		},
		{
			key: "detail",
			label: t("employees:import.colDetail"),
			width: "1.8fr",
			render: (r) =>
				r.errors.length === 0 ? (
					<span className="text-xs text-faint">
						{r.isActive ? t("employees:active") : t("employees:inactive")}
					</span>
				) : (
					<span className="text-xs text-warning leading-relaxed">
						{r.errors.join(" / ")}
					</span>
				),
		},
	];

	if (!open || !preview) return null;

	const canImport = preview.errorCount === 0 && preview.validCount > 0;

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-230 max-w-full max-h-[85vh] flex flex-col bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-7"
			>
				<div className="mb-5">
					<div className="text-lg font-bold">{t("employees:import.title")}</div>
					<div className="text-xs text-faint mt-0.75">{fileName}</div>
				</div>

				<div className="flex items-center gap-2.5 mb-4">
					<Badge tone="success">
						{t("employees:import.okCount", { count: preview.validCount })}
					</Badge>
					<Badge tone={preview.errorCount > 0 ? "warning" : "draft"}>
						{t("employees:import.errorCount", { count: preview.errorCount })}
					</Badge>
				</div>

				<div className="overflow-auto flex-1 min-h-0">
					<Table columns={columns} rows={preview.rows} rowKey={(r) => r.line} />
				</div>

				{preview.errorCount > 0 && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-4 leading-relaxed">
						{t("employees:import.hasErrors")}
					</div>
				)}

				{errorMessage && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mt-4 leading-relaxed">
						{errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2.5 mt-6">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						{t("common:cancel")}
					</Button>
					<Button onClick={onConfirm} disabled={!canImport || isPending}>
						{isPending
							? t("employees:import.importing")
							: t("employees:import.importCount", {
									count: preview.validCount,
								})}
					</Button>
				</div>
			</div>
		</div>
	);
}
