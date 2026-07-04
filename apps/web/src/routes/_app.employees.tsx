import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Avatar } from "#/components/ui/Avatar";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { PagerButton } from "#/components/ui/PagerButton";
import { Table, type TableColumn } from "#/components/ui/Table";
import {
	EmployeeFormDialog,
	type EmployeeFormValues,
} from "#/features/employees/EmployeeFormDialog";
import { MOCK_EMPLOYEES } from "#/features/employees/mock";
import type { EmployeeRow } from "#/features/employees/types";

const CURRENT_SITE = "A工場";
const PAGE_SIZE = 50;

type EmployeeFilter = "all" | "active" | "inactive";

const FILTERS: { key: EmployeeFilter; label: string }[] = [
	{ key: "all", label: "すべて" },
	{ key: "active", label: "有効" },
	{ key: "inactive", label: "無効" },
];

export const Route = createFileRoute("/_app/employees")({
	component: EmployeeList,
});

function EmployeeList() {
	const [employees, setEmployees] = useState<EmployeeRow[]>(MOCK_EMPLOYEES);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<EmployeeFilter>("all");
	const [page, setPage] = useState(1);
	const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
	const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(
		null,
	);

	const siteEmployees = useMemo(
		() => employees.filter((e) => e.site === CURRENT_SITE),
		[employees],
	);

	const openCreateDialog = () => {
		setEditingEmployee(null);
		setDialogMode("create");
	};

	const openEditDialog = (employee: EmployeeRow) => {
		setEditingEmployee(employee);
		setDialogMode("edit");
	};

	const closeDialog = () => {
		setDialogMode(null);
		setEditingEmployee(null);
	};

	const handleSubmit = (data: EmployeeFormValues) => {
		if (dialogMode === "edit" && editingEmployee) {
			setEmployees((prev) =>
				prev.map((e) => (e.id === editingEmployee.id ? { ...e, ...data } : e)),
			);
		} else {
			setEmployees((prev) => [
				...prev,
				{ ...data, id: `e${Date.now()}`, site: CURRENT_SITE },
			]);
		}
		closeDialog();
	};

	const filtered = useMemo(() => {
		const q = search.trim();
		return siteEmployees.filter((e) => {
			if (filter === "active" && !e.isActive) return false;
			if (filter === "inactive" && e.isActive) return false;
			if (
				q &&
				!`${e.lastName}${e.firstName}${e.code}${e.tags.join("")}`.includes(q)
			) {
				return false;
			}
			return true;
		});
	}, [siteEmployees, search, filter]);

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
				前へ
			</PagerButton>
			<span className="text-xs font-semibold text-ink px-1.5">
				{currentPage} / {pageCount}
			</span>
			<PagerButton
				onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
				disabled={currentPage >= pageCount}
			>
				次へ
			</PagerButton>
		</div>
	);

	const columns: TableColumn<EmployeeRow>[] = [
		{
			key: "name",
			label: "従業員",
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
			label: "社員番号",
			width: "1.2fr",
			render: (e) => (
				<span className="text-muted font-mono text-xs">{e.code}</span>
			),
		},
		{
			key: "tags",
			label: "タグ",
			width: "2fr",
			render: (e) => (
				<div className="flex flex-wrap gap-1.25">
					{e.tags.map((t) => (
						<Badge key={t} tone="primary">
							{t}
						</Badge>
					))}
				</div>
			),
		},
		{
			key: "status",
			label: "状態",
			width: "1fr",
			render: (e) => (
				<div className="flex items-center justify-between gap-2">
					<Badge tone={e.isActive ? "success" : "draft"}>
						{e.isActive ? "有効" : "無効"}
					</Badge>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => openEditDialog(e)}
					>
						編集
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
						<div className="text-[22px] font-bold">従業員</div>
						<div className="text-[13.5px] text-muted mt-1.25">
							{CURRENT_SITE} の従業員 {siteEmployees.length}{" "}
							名。検索・絞り込み、CSV取込ができます。
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="secondary">CSV取込</Button>
						<Button onClick={openCreateDialog}>＋ 従業員を追加</Button>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3.5 mb-3.5 flex-wrap">
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder="氏名・社員番号・役割で検索"
						className="min-w-55 flex-1"
					/>
					<div className="flex items-center gap-1 bg-app-bg border border-border rounded-md p-0.75">
						{FILTERS.map((f) => (
							<button
								key={f.key}
								type="button"
								onClick={() => {
									setFilter(f.key);
									setPage(1);
								}}
								className={`text-xs px-3.5 py-1.75 rounded-sm cursor-pointer ${
									filter === f.key
										? "font-bold text-primary bg-primary-soft"
										: "font-semibold text-muted"
								}`}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between mb-2">
					<div className="text-xs font-semibold text-muted">
						{filtered.length} 件中{" "}
						{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
						{Math.min(currentPage * PAGE_SIZE, filtered.length)} 件を表示
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
				onSubmit={handleSubmit}
				onCancel={closeDialog}
			/>
		</div>
	);
}
