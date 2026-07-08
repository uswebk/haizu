import type { Role } from "@haizu/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { OptionCard } from "#/components/ui/OptionCard";
import { useSite } from "#/contexts/site-context";
import { useDismiss } from "#/hooks/useDismiss";
import { ROLE_LABEL } from "#/lib/roles";
import type { MemberRow } from "./types";

export type MemberFormValues = {
	lastName: string;
	firstName: string;
	email: string;
	role: Role;
	siteIds: string[];
	isActive: boolean;
};

type Props = {
	open: boolean;
	mode: "invite" | "edit";
	initialValue?: MemberRow;
	isPending?: boolean;
	errorMessage?: string | null;
	onSubmit: (data: MemberFormValues) => void;
	onCancel: () => void;
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
	admin: "全拠点・全設定にアクセス",
	site_admin: "担当拠点の編集が可能",
	general: "一般権限（設定不可）",
	viewer: "ビュアー閲覧のみ",
};

const ROLE_ORDER: Role[] = ["admin", "site_admin", "general", "viewer"];

function draftFromProps(
	mode: "invite" | "edit",
	initialValue: MemberRow | undefined,
): MemberFormValues {
	if (mode === "edit" && initialValue) {
		return {
			lastName: "",
			firstName: "",
			email: initialValue.email,
			role: initialValue.role,
			siteIds: initialValue.allSites ? [] : [...initialValue.siteIds],
			isActive: initialValue.status !== "inactive",
		};
	}
	return {
		lastName: "",
		firstName: "",
		email: "",
		role: "general",
		siteIds: [],
		isActive: true,
	};
}

export function MemberFormDialog({
	open,
	mode,
	initialValue,
	isPending = false,
	errorMessage,
	onSubmit,
	onCancel,
}: Props) {
	const contentRef = useRef<HTMLDivElement>(null);
	useDismiss(open, onCancel, contentRef);

	const { activeSites } = useSite();

	const [draft, setDraft] = useState<MemberFormValues>(() =>
		draftFromProps(mode, initialValue),
	);

	// ダイアログを開くたびに対象データへ合わせて下書きを作り直す
	useEffect(() => {
		if (open) setDraft(draftFromProps(mode, initialValue));
	}, [open, mode, initialValue]);

	if (!open) return null;

	const toggleSite = (siteId: string) => {
		setDraft((d) => ({
			...d,
			siteIds: d.siteIds.includes(siteId)
				? d.siteIds.filter((s) => s !== siteId)
				: [...d.siteIds, siteId],
		}));
	};

	const canSave =
		mode === "edit" ||
		(draft.lastName.trim().length > 0 && draft.email.trim().length > 0);

	const handleSave = () => {
		if (!canSave) return;
		onSubmit({
			...draft,
			lastName: draft.lastName.trim(),
			firstName: draft.firstName.trim(),
			email: draft.email.trim(),
		});
	};

	return (
		<div className="fixed inset-0 bg-[rgba(16,28,44,.42)] flex items-center justify-center p-6 z-60">
			<div
				ref={contentRef}
				className="w-130 max-w-full max-h-full overflow-auto bg-surface rounded-section shadow-[0_24px_60px_rgba(16,42,67,.3)] p-7"
			>
				<div className="mb-6">
					<div className="text-lg font-bold">
						{mode === "invite" ? "メンバーを招待" : "メンバーを編集"}
					</div>
					<div className="text-xs text-faint mt-0.75">
						{mode === "invite"
							? "メールアドレスに招待を送り、権限と担当拠点を設定します"
							: `${initialValue?.name ?? ""}（${initialValue?.email ?? ""}）`}
					</div>
				</div>

				{mode === "invite" && (
					<>
						<div className="grid grid-cols-2 gap-3 mb-4.5">
							<Input
								label="姓"
								value={draft.lastName}
								onChange={(e) =>
									setDraft((d) => ({ ...d, lastName: e.target.value }))
								}
								placeholder="山田"
							/>
							<Input
								label="名"
								value={draft.firstName}
								onChange={(e) =>
									setDraft((d) => ({ ...d, firstName: e.target.value }))
								}
								placeholder="健一"
							/>
						</div>

						<Input
							label="メールアドレス"
							value={draft.email}
							onChange={(e) =>
								setDraft((d) => ({ ...d, email: e.target.value }))
							}
							placeholder="name@haiz.co.jp"
							className="mb-4.5"
						/>
					</>
				)}

				<div className="mb-2 text-xs font-semibold text-muted">権限</div>
				<div className="flex flex-col gap-2 mb-4.5">
					{ROLE_ORDER.map((role) => (
						<OptionCard
							key={role}
							title={ROLE_LABEL[role]}
							description={ROLE_DESCRIPTIONS[role]}
							selected={draft.role === role}
							onClick={() => setDraft((d) => ({ ...d, role }))}
						/>
					))}
				</div>

				{draft.role === "admin" ? (
					<div className="mb-4.5 px-3.75 py-3.25 border border-border rounded-md bg-app-bg text-[12.5px] text-muted">
						全拠点にアクセスできます
					</div>
				) : (
					<>
						<div className="mb-2 text-xs font-semibold text-muted">
							担当拠点
							<span className="text-faint font-medium">（複数選択可）</span>
						</div>
						<div className="flex flex-wrap gap-2 mb-4.5">
							{activeSites.map((site) => {
								const on = draft.siteIds.includes(site.id);
								return (
									<button
										key={site.id}
										type="button"
										onClick={() => toggleSite(site.id)}
										className={`text-[12.5px] px-3.25 py-2 rounded-sm border cursor-pointer ${
											on
												? "font-bold border-primary text-primary bg-primary-soft"
												: "font-semibold border-border text-muted bg-surface"
										}`}
									>
										{site.name}
									</button>
								);
							})}
						</div>
					</>
				)}

				{mode === "edit" && (
					<button
						type="button"
						onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
						className="w-full flex items-center justify-between px-3.5 py-3 border border-border rounded-md cursor-pointer mb-6 text-left"
					>
						<div>
							<div className="text-[13.5px] font-semibold">
								このメンバーを有効にする
							</div>
							<div className="text-[11.5px] text-faint">
								停止中のメンバーはログインできません
							</div>
						</div>
						<div
							className="w-11 h-6.5 rounded-pill relative"
							style={{
								background: draft.isActive
									? "var(--color-primary)"
									: "var(--color-hairline)",
							}}
						>
							<div
								className="absolute top-0.75 w-5 h-5 rounded-full bg-white transition-[right,left]"
								style={draft.isActive ? { right: "3px" } : { left: "3px" }}
							/>
						</div>
					</button>
				)}

				{errorMessage && (
					<div className="text-[12.5px] text-warning bg-warning-soft rounded-md px-3 py-2 mb-4 leading-relaxed">
						{errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2.5">
					<Button variant="secondary" onClick={onCancel} disabled={isPending}>
						キャンセル
					</Button>
					<Button onClick={handleSave} disabled={!canSave || isPending}>
						{isPending
							? "保存中…"
							: mode === "invite"
								? "招待する"
								: "保存する"}
					</Button>
				</div>
			</div>
		</div>
	);
}
