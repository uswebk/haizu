import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const submit = async () => {
		if (!email || !password) return;
		setSubmitting(true);
		setError(null);
		const { data, error } = await authClient.signIn.email({ email, password });
		setSubmitting(false);
		if (error) {
			setError("メールアドレスまたはパスワードが正しくありません");
			return;
		}
		// メール未確認ならOTP確認画面へ
		void navigate({
			to: data && !data.user.emailVerified ? "/verify-otp" : "/select-site",
		});
	};

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
				<div className="text-lg font-bold">ログイン</div>
				<div className="text-[13px] text-muted mt-1">
					メールアドレスとパスワードでログインします。
				</div>

				<form
					className="flex flex-col gap-3.5 mt-5"
					onSubmit={(e) => {
						e.preventDefault();
						void submit();
					}}
				>
					<Input
						label="メールアドレス"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						autoComplete="email"
					/>
					<Input
						label="パスワード"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						autoComplete="current-password"
					/>
					{error && <div className="text-[12.5px] text-danger">{error}</div>}
					<Button
						type="submit"
						className="w-full mt-1"
						disabled={!email || !password || submitting}
					>
						{submitting ? "ログイン中…" : "ログイン"}
					</Button>
				</form>

				<div className="text-[12.5px] text-center mt-4">
					<Link to="/forgot-password" className="text-primary font-semibold">
						パスワードを忘れた方
					</Link>
				</div>

				<div className="text-[12.5px] text-muted mt-2 text-center">
					アカウントをお持ちでない方は{" "}
					<Link to="/signup" className="text-primary font-semibold">
						新規登録
					</Link>
				</div>
			</div>
		</div>
	);
}
