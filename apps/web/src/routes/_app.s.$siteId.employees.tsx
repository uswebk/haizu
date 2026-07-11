import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "#/components/ui/Avatar";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { PagerButton } from "#/components/ui/PagerButton";
import { Table, type TableColumn } from "#/components/ui/Table";
import { useSite } from "#/contexts/site-context";
import { useSnackbar } from "#/contexts/snackbar-context";
import { employeesToCsv, parseEmployeesCsv } from "#/features/employees/csv";
import {
	EmployeeFormDialog,
	type EmployeeFormValues,
} from "#/features/employees/EmployeeFormDialog";
import { ImportPreviewDialog } from "#/features/employees/ImportPreviewDialog";
import {
	type ImportPreview,
	validateImport,
} from "#/features/employees/importValidation";
import type { EmployeeRow } from "#/features/employees/types";
import {
	createEmployee,
	employeeKeys,
	fetchEmployees,
	importEmployees,
	updateEmployee,
} from "#/lib/api/employees";
import { fetchTags, tagKeys } from "#/lib/api/tags";
import { todayStr } from "#/lib/datetime";
import { assertScreen } from "#/lib/guards";

const PAGE_SIZE = 50;

type EmployeeFilter = "all" | "active" | "inactive";

const FILTER_KEYS: EmployeeFilter[] = ["all", "active", "inactive"];

export const Route = createFileRoute("/_app/s/$siteId/employees")({
	beforeLoad: ({ context, params }) => {
		assertScreen(
			context.user.role,
			context.siteRole,
			params.siteId,
			"employees",
		);
	},
	component: EmployeeList,
});

function EmployeeList() {
	const queryClient = useQueryClient();
	const { t } = useTranslation(["employees", "common"]);
	const { showSuccess } = useSnackbar();
	const { currentSite } = useSite();
	const { data: employees = [] } = useQuery({
		queryKey: employeeKeys.all,
		queryFn: fetchEmployees,
	});
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<EmployeeFilter>("active");
	const [page, setPage] = useState(1);
	const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
	const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(
		null,
	);

	const [saveError, setSaveError] = useState<string | null>(null);

	const saveMutation = useMutation({
		mutationFn: (data: EmployeeFormValues) =>
			editingEmployee
				? updateEmployee(editingEmployee.id, data)
				: createEmployee(data),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: employeeKeys.all });
			closeDialog();
			showSuccess(
				editingEmployee ? t("employees:updated") : t("employees:created"),
			);
		},
		onError: (error) => {
			setSaveError(
				error instanceof Error ? error.message : t("employees:saveFailed"),
			);
		},
	});

	const { data: tags = [] } = useQuery({
		queryKey: tagKeys.all,
		queryFn: fetchTags,
	});

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importPreview, setImportPreview] = useState<ImportPreview | null>(
		null,
	);
	const [importFileName, setImportFileName] = useState("");
	const [importError, setImportError] = useState<string | null>(null);

	const importMutation = useMutation({
		mutationFn: () => {
			const inputs = (importPreview?.rows ?? [])
				.map((r) => r.input)
				.filter((v): v is NonNullable<typeof v> => v !== null);
			return importEmployees(inputs);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: employeeKeys.all });
			void queryClient.invalidateQueries({ queryKey: tagKeys.all });
			closeImport();
			showSuccess(t("employees:imported"));
		},
		onError: (error) => {
			setImportError(
				error instanceof Error ? error.message : t("employees:importFailed"),
			);
		},
	});

	const handleExport = () => {
		const csv = employeesToCsv(employees);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		const stamp = todayStr().replace(/-/g, "");
		anchor.href = url;
		anchor.download = `haizu_employees_${stamp}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Reset the input so the same file can be selected again
		e.target.value = "";
		if (!file) return;
		const text = await file.text();
		const parsed = parseEmployeesCsv(text);
		setImportError(null);
		setImportFileName(file.name);
		setImportPreview(validateImport(parsed, employees, tags));
	};

	const closeImport = () => {
		setImportPreview(null);
		setImportFileName("");
		setImportError(null);
	};

	const openCreateDialog = () => {
		setEditingEmployee(null);
		setSaveError(null);
		setDialogMode("create");
	};

	const openEditDialog = (employee: EmployeeRow) => {
		setEditingEmployee(employee);
		setSaveError(null);
		setDialogMode("edit");
	};

	const closeDialog = () => {
		setDialogMode(null);
		setEditingEmployee(null);
		setSaveError(null);
	};

	const filtered = useMemo(() => {
		const q = search.trim();
		return employees.filter((e) => {
			if (filter === "active" && !e.isActive) return false;
			if (filter === "inactive" && e.isActive) return false;
			if (
				q &&
				!`${e.lastName}${e.firstName}${e.code}${e.tags.map((t) => t.name).join("")}`.includes(
					q,
				)
			) {
				return false;
			}
			return true;
		});
	}, [employees, search, filter]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount);

	const paged = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filtered.slice(start, start + PAGE_SIZE);
	}, [filtered, currentPage]);

	const pager = (
		<div className="flex items-center gap-1.5">
			<PagerButton
				onClick={() => setPage((p) => Math.max(1, p - 1))}
				disabled={currentPage <= 1}
			>
				{t("employees:prev")}
			</PagerButton>
			<span className="text-xs font-semibold text-ink px-1.5">
				{currentPage} / {pageCount}
			</span>
			<PagerButton
				onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
				disabled={currentPage >= pageCount}
			>
				{t("employees:next")}
			</PagerButton>
		</div>
	);

	const columns: TableColumn<EmployeeRow>[] = [
		{
			key: "name",
			label: t("employees:colName"),
			width: "2fr",
			render: (e) => (
				<div className="flex items-center gap-2.75 min-w-0">
					<Avatar
						name={e.lastName}
						color={e.isActive ? e.avatarColor : "var(--color-faint)"}
						size={34}
					/>
					<span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
						{e.lastName} {e.firstName}
					</span>
				</div>
			),
		},
		{
			key: "code",
			label: t("employees:colCode"),
			width: "1.2fr",
			render: (e) => (
				<span className="text-muted font-mono text-xs">{e.code}</span>
			),
		},
		{
			key: "tags",
			label: t("employees:colTags"),
			width: "2fr",
			render: (e) => (
				<div className="flex flex-wrap gap-1.25">
					{e.tags.map((t) => (
						<Badge key={t.id} tone="primary">
							{t.name}
						</Badge>
					))}
				</div>
			),
		},
		{
			key: "status",
			label: t("employees:colStatus"),
			width: "1fr",
			render: (e) => (
				<div className="flex items-center justify-between gap-2">
					<Badge tone={e.isActive ? "success" : "draft"}>
						{e.isActive ? t("employees:active") : t("employees:inactive")}
					</Badge>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => openEditDialog(e)}
					>
						{t("common:edit")}
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-245">
				<div className="flex items-end justify-between gap-5 mb-4.5 flex-wrap">
					<div>
						<div className="text-[22px] font-bold">{t("employees:title")}</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							{t("employees:subtitle", {
								site: currentSite.name,
								count: employees.length,
							})}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={handleFileSelected}
						/>
						<Button variant="secondary" onClick={handleExport}>
							{t("employees:exportCsv")}
						</Button>
						<Button
							variant="secondary"
							onClick={() => fileInputRef.current?.click()}
						>
							{t("employees:importCsv")}
						</Button>
						<Button onClick={openCreateDialog}>
							{t("employees:addButton")}
						</Button>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3.5 mb-3.5 flex-wrap">
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder={t("employees:searchPlaceholder")}
						className="min-w-55 flex-1"
					/>
					<div className="flex items-center gap-1 bg-app-bg border border-border rounded-md p-0.75">
						{FILTER_KEYS.map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => {
									setFilter(key);
									setPage(1);
								}}
								className={`text-xs px-3.5 py-1.75 rounded-sm cursor-pointer ${
									filter === key
										? "font-bold text-primary bg-primary-soft"
										: "font-semibold text-muted"
								}`}
							>
								{t(`employees:filter.${key}`)}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between mb-2">
					<div className="text-xs font-semibold text-muted">
						{t("employees:showing", {
							total: filtered.length,
							from:
								filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1,
							to: Math.min(currentPage * PAGE_SIZE, filtered.length),
						})}
					</div>
					{pager}
				</div>

				<Table columns={columns} rows={paged} rowKey={(e) => e.id} />

				<div className="flex items-center justify-end mt-2.5">{pager}</div>
			</div>

			<EmployeeFormDialog
				open={dialogMode !== null}
				mode={dialogMode ?? "create"}
				initialValue={editingEmployee ?? undefined}
				isPending={saveMutation.isPending}
				errorMessage={saveError}
				onSubmit={(data) => {
					setSaveError(null);
					saveMutation.mutate(data);
				}}
				onCancel={closeDialog}
			/>

			<ImportPreviewDialog
				open={importPreview !== null}
				preview={importPreview}
				fileName={importFileName}
				isPending={importMutation.isPending}
				errorMessage={importError}
				onConfirm={() => {
					setImportError(null);
					importMutation.mutate();
				}}
				onCancel={closeImport}
			/>
		</div>
	);
}
