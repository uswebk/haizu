import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import {
	acceptInvitation,
	fetchInvitationPreview,
} from "#/lib/api/invitations";

type InviteAcceptSearch = { token?: string };

export const Route = createFileRoute("/invite-accept")({
	validateSearch: (search): InviteAcceptSearch => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	component: InviteAcceptPage,
});

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f0f5fb] to-app-bg flex flex-col items-center justify-center p-10">
			<div className="flex items-center gap-2.75 pb-6">
				<img
					src="/logo.svg"
					alt="haizu"
					className="w-11.5 h-11.5 rounded-[12px]"
				/>
				<div>
					<div className="font-bold text-2xl leading-none text-ink">haizu</div>
					<div className="font-mono text-[9.5px] tracking-[.14em] text-faint mt-1">
						配置管理SYSTEM
					</div>
				</div>
			</div>

			<div className="w-90 max-w-full bg-surface border border-border rounded-section p-6.5">
				{children}
			</div>
		</div>
	);
}

function InviteAcceptPage() {
	const { token } = Route.useSearch();

	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [accepted, setAccepted] = useState(false);

	const {
		data: invitation,
		isLoading,
		error: previewError,
	} = useQuery({
		queryKey: ["invitation-preview", token],
		queryFn: () => fetchInvitationPreview(token as string),
		enabled: !!token,
		retry: false,
	});

	if (!token) {
		return (
			<Shell>
				<div className="text-lg font-bold">招待の受け入れ</div>
				<div className="text-[13px] text-danger mt-2">
					招待URLが正しくありません。
				</div>
			</Shell>
		);
	}

	if (isLoading) {
		return (
			<Shell>
				<div className="text-[13px] text-muted">確認中…</div>
			</Shell>
		);
	}

	if (previewError || !invitation) {
		return (
			<Shell>
				<div className="text-lg font-bold">招待の受け入れ</div>
				<div className="text-[13px] text-danger mt-2">
					{previewError instanceof Error
						? previewError.message
						: "招待が見つかりません"}
				</div>
				<div className="text-[12.5px] text-muted mt-4 text-center">
					<Link to="/login" className="text-primary font-semibold">
						ログイン画面へ
					</Link>
				</div>
			</Shell>
		);
	}

	if (accepted) {
		return (
			<Shell>
				<div className="text-lg font-bold">パスワードを設定しました</div>
				<div className="text-[13px] text-muted mt-1">
					設定したパスワードでログインしてください。
				</div>
				<Link to="/login" className="block mt-5">
					<Button className="w-full">ログイン画面へ</Button>
				</Link>
			</Shell>
		);
	}

	const canSubmit = password.length >= 8 && !submitting;

	const submit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			await acceptInvitation(token, password);
			setAccepted(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "招待の受け入れに失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Shell>
			<div className="text-lg font-bold">パスワードの設定</div>
			<div className="text-[13px] text-muted mt-1">
				{invitation.lastName} {invitation.firstName} 様（{invitation.email}）を
				{invitation.orgRole === "admin" ? "管理者" : "メンバー"}
				として招待します。
			</div>

			<form
				className="flex flex-col gap-3.5 mt-5"
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				<Input
					label="パスワード（8文字以上）"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					autoComplete="new-password"
					autoFocus
				/>
				{error && <div className="text-[12.5px] text-danger">{error}</div>}
				<Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
					{submitting ? "設定中…" : "パスワードを設定する"}
				</Button>
			</form>
		</Shell>
	);
}
