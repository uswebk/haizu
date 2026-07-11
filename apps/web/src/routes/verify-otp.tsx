import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { authClient } from "#/lib/auth-client";
import { fetchSession } from "#/lib/session";

export const Route = createFileRoute("/verify-otp")({
	beforeLoad: async () => {
		const user = await fetchSession();
		// If not logged in, go to login. If already verified, go to the app.
		if (!user) throw redirect({ to: "/login" });
		if (user.emailVerified) throw redirect({ to: "/select-site" });
		return { email: user.email };
	},
	component: VerifyOtpPage,
});

function VerifyOtpPage() {
	const { t } = useTranslation(["auth", "common"]);
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
			setError(t("verify.otpInvalid"));
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
						{t("common:appTagline")}
					</div>
				</div>
			</div>

			<div className="w-90 max-w-full bg-surface border border-border rounded-section p-6.5">
				<div className="text-lg font-bold">{t("verify.title")}</div>
				<div className="text-[13px] text-muted mt-1">
					{t("verify.subtitle", { email })}
				</div>

				<form
					className="flex flex-col gap-3.5 mt-5"
					onSubmit={(e) => {
						e.preventDefault();
						void submit();
					}}
				>
					<Input
						label={t("verify.otpLabel")}
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
						{submitting ? t("verify.verifying") : t("verify.verify")}
					</Button>
				</form>
			</div>
		</div>
	);
}
