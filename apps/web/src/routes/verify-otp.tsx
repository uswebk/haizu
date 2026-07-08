import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { authClient, getSession } from "#/lib/auth-client";

export const Route = createFileRoute("/verify-otp")({
	beforeLoad: async () => {
		const { data } = await getSession();
		// 未ログインならログインへ。確認済みならアプリへ。
		if (!data) throw redirect({ to: "/login" });
		if (data.user.emailVerified) throw redirect({ to: "/select-site" });
		// サインアップ直後は authClient のセッションストアがまだ新規ユーザーで
		// 更新されていないことがあるため、useSession() ではなくここで取得した
		// フレッシュなセッションのメールを確認対象として使う。
		return { email: data.user.email };
	},
	component: VerifyOtpPage,
});

function VerifyOtpPage() {
	const navigate = useNavigate();
	const { email } = Route.useRouteContext();

	const [otp, setOtp] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const submit = async () => {
		if (!email || otp.length === 0) return;
		setSubmitting(true);
		setError(null);
		const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
		setSubmitting(false);
		if (error) {
			setError("確認コードが正しくありません");
			return;
		}
		void navigate({ to: "/select-site" });
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
				<div className="text-lg font-bold">メールアドレスの確認</div>
				<div className="text-[13px] text-muted mt-1">
					{email} に送信した確認コードを入力してください。
				</div>

				<form
					className="flex flex-col gap-3.5 mt-5"
					onSubmit={(e) => {
						e.preventDefault();
						void submit();
					}}
				>
					<Input
						label="確認コード"
						value={otp}
						onChange={(e) => setOtp(e.target.value.trim())}
						placeholder="123456"
						inputMode="numeric"
						autoComplete="one-time-code"
						autoFocus
					/>
					{error && <div className="text-[12.5px] text-danger">{error}</div>}
					<Button
						type="submit"
						className="w-full mt-1"
						disabled={!otp || submitting}
					>
						{submitting ? "確認中…" : "確認する"}
					</Button>
				</form>
			</div>
		</div>
	);
}
