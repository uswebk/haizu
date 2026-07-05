import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { EmptyState } from "#/components/ui/EmptyState";
import { Input } from "#/components/ui/Input";
import { PagerButton } from "#/components/ui/PagerButton";
import {
	createTag,
	deleteTag,
	fetchTags,
	tagKeys,
	updateTag,
} from "#/lib/api/tags";

const PAGE_SIZE = 50;

export const Route = createFileRoute("/_app/settings/tags")({
	component: TagSettings,
});

function TagSettings() {
	const queryClient = useQueryClient();
	const { data: tags = [] } = useQuery({
		queryKey: tagKeys.all,
		queryFn: fetchTags,
	});

	const [page, setPage] = useState(1);
	const [newTagName, setNewTagName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		name: string;
		employeeCount: number;
	} | null>(null);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: tagKeys.all });

	const createMutation = useMutation({
		mutationFn: (name: string) => createTag(name),
		onSuccess: () => {
			setNewTagName("");
			void invalidate();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			updateTag(id, name),
		onSuccess: () => {
			setEditingId(null);
			void invalidate();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteTag(id),
		onSuccess: () => {
			setDeleteTarget(null);
			void invalidate();
		},
	});

	const submitNewTag = () => {
		const name = newTagName.trim();
		if (!name) return;
		createMutation.mutate(name);
	};

	const startEdit = (id: string, name: string) => {
		setEditingId(id);
		setEditingName(name);
	};

	const submitEdit = () => {
		const name = editingName.trim();
		if (!editingId || !name) return;
		updateMutation.mutate({ id: editingId, name });
	};

	const pageCount = Math.max(1, Math.ceil(tags.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount);

	const paged = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return tags.slice(start, start + PAGE_SIZE);
	}, [tags, currentPage]);

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

	return (
		<div className="p-7 overflow-auto h-full">
			<div className="max-w-170">
				<Link
					to="/settings"
					className="text-xs font-semibold text-muted hover:text-ink"
				>
					← 設定
				</Link>
				<div className="text-[22px] font-bold mt-2">
					タグ管理 （{tags.length}）
				</div>
				<div className="text-[13.5px] text-muted mt-1.25">
					従業員に付けられるタグです。削除すると各従業員からも外れます。
				</div>

				<div className="bg-surface border border-border rounded-lg p-4.5 mt-4.5">
					<div className="flex items-center gap-2">
						<Input
							value={newTagName}
							onChange={(e) => setNewTagName(e.target.value)}
							placeholder="新しいタグ名"
							maxLength={20}
							className="flex-1"
							onKeyDown={(e) => {
								if (e.key === "Enter") submitNewTag();
							}}
						/>
						<Button
							onClick={submitNewTag}
							disabled={!newTagName.trim() || createMutation.isPending}
						>
							追加
						</Button>
					</div>

					<div className="h-px bg-hairline my-4" />

					{tags.length === 0 ? (
						<EmptyState
							title="タグがありません"
							hint="上のフォームから新しいタグを追加してください"
						/>
					) : (
						<>
							<div className="flex items-center justify-end mb-2.5">
								{pager}
							</div>
							<ul className="flex flex-col gap-2.5">
								{paged.map((tag) => (
									<li
										key={tag.id}
										className="flex items-center gap-2.5 px-4 py-3 border border-border rounded-md"
									>
										{editingId === tag.id ? (
											<>
												<Input
													value={editingName}
													onChange={(e) => setEditingName(e.target.value)}
													className="flex-1"
													maxLength={20}
													autoFocus
													onKeyDown={(e) => {
														if (e.key === "Enter") submitEdit();
														if (e.key === "Escape") setEditingId(null);
													}}
												/>
												<Button
													variant="secondary"
													size="sm"
													onClick={() => setEditingId(null)}
												>
													キャンセル
												</Button>
												<Button
													size="sm"
													onClick={submitEdit}
													disabled={
														!editingName.trim() || updateMutation.isPending
													}
												>
													保存
												</Button>
											</>
										) : (
											<>
												<Badge
													tone="primary"
													className="text-[13px] py-1.5 px-3"
												>
													{tag.name}
												</Badge>
												<span className="text-xs text-faint">
													{tag.employeeCount}名が使用
												</span>
												<div className="flex-1" />
												<Button
													variant="secondary"
													size="sm"
													onClick={() => startEdit(tag.id, tag.name)}
												>
													編集
												</Button>
												<Button
													variant="danger"
													size="sm"
													onClick={() => setDeleteTarget(tag)}
												>
													削除
												</Button>
											</>
										)}
									</li>
								))}
							</ul>
							<div className="flex items-center justify-end mt-2.5">
								{pager}
							</div>
						</>
					)}
				</div>
			</div>

			{deleteTarget && (
				<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
					<div className="w-105 max-w-full bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-5.5">
						<div className="text-base font-bold mb-2">タグを削除</div>
						<div className="text-[13.5px] text-muted">
							「{deleteTarget.name}」を削除します。
							{deleteTarget.employeeCount > 0 &&
								`${deleteTarget.employeeCount}名の従業員からこのタグが取り除かれます。`}
							元に戻せません。
						</div>
						<div className="flex justify-end gap-2.5 mt-6">
							<Button
								variant="secondary"
								onClick={() => setDeleteTarget(null)}
								disabled={deleteMutation.isPending}
							>
								キャンセル
							</Button>
							<Button
								variant="danger"
								onClick={() => deleteMutation.mutate(deleteTarget.id)}
								disabled={deleteMutation.isPending}
							>
								{deleteMutation.isPending ? "削除中…" : "削除する"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
