import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { signUp } from "#/lib/api/auth";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const canSubmit =
		name && companyName && email && password.length >= 8 && !submitting;

	const submit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			await signUp({ name, companyName, email, password });
			void navigate({ to: "/verify-otp" });
		} catch (e) {
			setError(e instanceof Error ? e.message : "サインアップに失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f0f5fb] to-app-bg flex flex-col items-center justify-center p-10">
			<div className="flex items-center gap-2.75 pb-6">
				<img
					src="/logo.svg"
					alt="haiz"
					className="w-11.5 h-11.5 rounded-[12px]"
				/>
				<div>
					<div className="font-bold text-2xl leading-none text-ink">haiz</div>
					<div className="font-mono text-[9.5px] tracking-[.14em] text-faint mt-1">
						配置管理SYSTEM
					</div>
				</div>
			</div>

			<div className="w-90 max-w-full bg-surface border border-border rounded-section p-6.5">
				<div className="text-lg font-bold">新規登録</div>
				<div className="text-[13px] text-muted mt-1">
					会社（組織）を新規に作成します。
				</div>

				<form
					className="flex flex-col gap-3.5 mt-5"
					onSubmit={(e) => {
						e.preventDefault();
						void submit();
					}}
				>
					<Input
						label="お名前"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="山田 太郎"
						autoComplete="name"
					/>
					<Input
						label="会社名"
						value={companyName}
						onChange={(e) => setCompanyName(e.target.value)}
						placeholder="株式会社haiz"
						autoComplete="organization"
					/>
					<Input
						label="メールアドレス"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						autoComplete="email"
					/>
					<Input
						label="パスワード（8文字以上）"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						autoComplete="new-password"
					/>
					{error && <div className="text-[12.5px] text-danger">{error}</div>}
					<Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
						{submitting ? "登録中…" : "登録する"}
					</Button>
				</form>

				<div className="text-[12.5px] text-muted mt-4 text-center">
					すでにアカウントをお持ちの方は{" "}
					<Link to="/login" className="text-primary font-semibold">
						ログイン
					</Link>
				</div>
			</div>
		</div>
	);
}
