import { MIN_PASSWORD_LENGTH } from "@haizu/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { t } = useTranslation(["auth", "common"]);
	const navigate = useNavigate();
	const [step, setStep] = useState<"email" | "reset">("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const sendOtp = async () => {
		if (!email) return;
		setSubmitting(true);
		setError(null);
		const { error: err } = await authClient.emailOtp.requestPasswordReset({
			email,
		});
		setSubmitting(false);
		if (err) {
			setError(t("forgot.sendFailed"));
			return;
		}
		setStep("reset");
	};

	const reset = async () => {
		if (password.length < MIN_PASSWORD_LENGTH) {
			setError(t("forgot.passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
			return;
		}
		if (password !== confirm) {
			setError(t("forgot.passwordMismatch"));
			return;
		}
		setSubmitting(true);
		setError(null);
		const { error: err } = await authClient.emailOtp.resetPassword({
			email,
			otp: otp.trim(),
			password,
		});
		setSubmitting(false);
		if (err) {
			setError(t("forgot.otpInvalid"));
			return;
		}
		void navigate({ to: "/login" });
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
				<div className="text-lg font-bold">{t("forgot.title")}</div>

				{step === "email" ? (
					<>
						<div className="text-[13px] text-muted mt-1">
							{t("forgot.emailStepDesc")}
						</div>
						<form
							className="flex flex-col gap-3.5 mt-5"
							onSubmit={(e) => {
								e.preventDefault();
								void sendOtp();
							}}
						>
							<Input
								label={t("common:email")}
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								autoComplete="email"
							/>
							{error && (
								<div className="text-[12.5px] text-danger">{error}</div>
							)}
							<Button
								type="submit"
								className="w-full mt-1"
								disabled={!email || submitting}
							>
								{submitting ? t("forgot.sending") : t("forgot.sendOtp")}
							</Button>
						</form>
					</>
				) : (
					<>
						<div className="text-[13px] text-muted mt-1">
							<span className="text-ink font-bold">{email}</span>{" "}
							{t("forgot.resetStepDesc")}
						</div>
						<form
							className="flex flex-col gap-3.5 mt-5"
							onSubmit={(e) => {
								e.preventDefault();
								void reset();
							}}
						>
							<Input
								label={t("forgot.otpLabel")}
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder={t("forgot.otpPlaceholder")}
							/>
							<Input
								label={t("forgot.newPassword")}
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={t("forgot.minChars", {
									min: MIN_PASSWORD_LENGTH,
								})}
								autoComplete="new-password"
							/>
							<Input
								label={t("forgot.newPasswordConfirm")}
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								autoComplete="new-password"
							/>
							{error && (
								<div className="text-[12.5px] text-danger">{error}</div>
							)}
							<Button
								type="submit"
								className="w-full mt-1"
								disabled={!otp || !password || !confirm || submitting}
							>
								{submitting ? t("forgot.resetting") : t("forgot.reset")}
							</Button>
						</form>
						<button
							type="button"
							onClick={() => {
								setStep("email");
								setError(null);
							}}
							className="text-[12.5px] font-semibold text-muted hover:text-ink cursor-pointer border-none bg-transparent mt-3 block mx-auto"
						>
							{t("forgot.reenterEmail")}
						</button>
					</>
				)}

				<div className="text-[12.5px] text-muted mt-4 text-center">
					<Link to="/login" className="text-primary font-semibold">
						{t("forgot.backToLogin")}
					</Link>
				</div>
			</div>
		</div>
	);
}
