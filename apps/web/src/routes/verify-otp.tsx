import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import { authClient } from "#/lib/auth-client";
import { fetchSession } from "#/lib/session";

const RESEND_COOLDOWN_SECONDS = 60;

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
	const { showSuccess } = useSnackbar();
	const { email } = Route.useRouteContext();

	const [otp, setOtp] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [resending, setResending] = useState(false);
	// A code is sent right before landing here (at sign-up), so start on cooldown.
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setInterval(() => {
			setCooldown((s) => (s <= 1 ? 0 : s - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const submit = async () => {
		if (!email || otp.length === 0) return;
		setSubmitting(true);
		setError(null);
		const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
		setSubmitting(false);
		if (error) {
			const stale =
				error.code === "OTP_EXPIRED" || error.code === "TOO_MANY_ATTEMPTS";
			if (stale) {
				// The current code can no longer succeed, so let them resend immediately.
				setCooldown(0);
				setError(
					t(
						error.code === "OTP_EXPIRED"
							? "verify.otpExpired"
							: "verify.otpTooManyAttempts",
					),
				);
				return;
			}
			setError(t("verify.otpInvalid"));
			return;
		}
		void navigate({ to: "/select-site" });
	};

	const resend = async () => {
		if (!email || cooldown > 0 || resending) return;
		setResending(true);
		setError(null);
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});
		setResending(false);
		if (error) {
			setError(t("verify.resendFailed"));
			return;
		}
		setOtp("");
		setCooldown(RESEND_COOLDOWN_SECONDS);
		showSuccess(t("verify.resent"));
	};

	// The account exists but is unverified and its email can't be changed, so the only
	// way out of a mistyped address is to drop this session and sign up again.
	const useAnotherEmail = async () => {
		await authClient.signOut();
		void navigate({ to: "/signup" });
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
					{t("verify.subtitle")}
				</div>
				<div className="text-[13px] font-bold text-ink mt-0.5">{email}</div>

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

				<div className="flex items-center justify-between gap-2.5 mt-4">
					<div className="text-[12.5px] text-muted">
						{t("verify.noCodeReceived")}
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={resend}
						disabled={cooldown > 0 || resending}
					>
						{cooldown > 0
							? t("verify.resendIn", { seconds: cooldown })
							: resending
								? t("verify.resending")
								: t("verify.resend")}
					</Button>
				</div>

				<div className="border-t border-border mt-5 pt-4">
					<div className="text-[12.5px] font-bold">
						{t("verify.wrongEmailTitle")}
					</div>
					<div className="text-xs text-faint mt-0.5">
						{t("verify.wrongEmailDesc")}
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="mt-2.5"
						onClick={useAnotherEmail}
					>
						{t("verify.useAnotherEmail")}
					</Button>
				</div>
			</div>
		</div>
	);
}
