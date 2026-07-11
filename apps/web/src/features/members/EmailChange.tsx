import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import { requestEmailChangeOtp, verifyEmailChangeOtp } from "#/lib/api/account";
import { memberKeys } from "#/lib/api/members";

export function EmailChange({ currentEmail }: { currentEmail: string }) {
	const { t } = useTranslation(["members", "common", "auth"]);
	const router = useRouter();
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"input" | "otp">("input");
	const [newEmail, setNewEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setOpen(false);
		setStep("input");
		setNewEmail("");
		setOtp("");
		setError(null);
	};

	const request = async () => {
		setBusy(true);
		setError(null);
		try {
			await requestEmailChangeOtp(newEmail.trim());
			setStep("otp");
			setOtp("");
		} catch (e) {
			setError(e instanceof Error ? e.message : t("common:errorOccurred"));
		} finally {
			setBusy(false);
		}
	};

	const verify = async () => {
		setBusy(true);
		setError(null);
		try {
			await verifyEmailChangeOtp(otp.trim());
			reset();
			await queryClient.invalidateQueries({ queryKey: memberKeys.all });
			// ヘッダー等のセッション表示を更新する
			await router.invalidate();
			showSuccess(t("members:email.changed"));
		} catch (e) {
			setError(e instanceof Error ? e.message : t("common:errorOccurred"));
		} finally {
			setBusy(false);
		}
	};

	if (!open) {
		return (
			<div className="flex items-center justify-between gap-3">
				<div>
					<div className="text-[13px] font-bold">{t("common:email")}</div>
					<div className="text-xs text-faint mt-0.5">{currentEmail}</div>
				</div>
				<Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
					{t("common:change")}
				</Button>
			</div>
		);
	}

	return (
		<div>
			<div className="text-[13px] font-bold mb-2.5">
				{t("members:email.changeTitle")}
			</div>
			{step === "input" ? (
				<>
					<Input
						label={t("members:email.new")}
						type="email"
						value={newEmail}
						placeholder="new@example.com"
						onChange={(e) => setNewEmail(e.target.value)}
						width={320}
					/>
					<div className="flex items-center gap-2.5 mt-3">
						<Button
							size="sm"
							onClick={request}
							disabled={
								busy ||
								newEmail.trim().length === 0 ||
								newEmail.trim() === currentEmail
							}
						>
							{busy ? t("auth:forgot.sending") : t("auth:forgot.sendOtp")}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={reset}
							disabled={busy}
						>
							{t("common:cancel")}
						</Button>
						{error && (
							<span className="text-xs font-semibold text-danger">{error}</span>
						)}
					</div>
				</>
			) : (
				<>
					<div className="text-xs text-muted mb-2.5">
						<span className="text-ink font-bold">{newEmail}</span>{" "}
						{t("members:email.otpSent")}
					</div>
					<Input
						label={t("auth:forgot.otpLabel")}
						value={otp}
						placeholder={t("auth:forgot.otpPlaceholder")}
						onChange={(e) => setOtp(e.target.value)}
						width={200}
					/>
					<div className="flex items-center gap-2.5 mt-3">
						<Button
							size="sm"
							onClick={verify}
							disabled={busy || otp.trim().length === 0}
						>
							{busy ? t("members:email.verifying") : t("members:email.confirm")}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setStep("input")}
							disabled={busy}
						>
							{t("common:back")}
						</Button>
						{error && (
							<span className="text-xs font-semibold text-danger">{error}</span>
						)}
					</div>
				</>
			)}
		</div>
	);
}
