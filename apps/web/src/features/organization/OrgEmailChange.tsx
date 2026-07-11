import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import {
	fetchOrganization,
	organizationKeys,
	requestOrgEmailOtp,
	verifyOrgEmailOtp,
} from "#/lib/api/organizations";

export function OrgEmailChange() {
	const queryClient = useQueryClient();
	const { t } = useTranslation(["orgSettings", "members", "auth", "common"]);
	const { showSuccess } = useSnackbar();
	const { data: organization } = useQuery({
		queryKey: organizationKeys.detail,
		queryFn: fetchOrganization,
	});

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
			await requestOrgEmailOtp(newEmail.trim());
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
			await verifyOrgEmailOtp(otp.trim());
			reset();
			await queryClient.invalidateQueries({
				queryKey: organizationKeys.detail,
			});
			showSuccess(t("orgSettings:email.changed"));
		} catch (e) {
			setError(e instanceof Error ? e.message : t("common:errorOccurred"));
		} finally {
			setBusy(false);
		}
	};

	const current = organization?.email ?? t("orgSettings:email.unset");

	return (
		<section className="bg-surface border border-border rounded-lg p-5.5 shadow-card mt-5">
			<div className="font-bold text-[15px] mb-3.5">
				{t("orgSettings:email.title")}
			</div>

			{!open ? (
				<div className="flex items-center justify-between gap-3">
					<div className="text-[13px] text-ink">{current}</div>
					<Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
						{t("common:change")}
					</Button>
				</div>
			) : step === "input" ? (
				<>
					<Input
						label={t("orgSettings:email.new")}
						type="email"
						value={newEmail}
						placeholder="contact@example.com"
						onChange={(e) => setNewEmail(e.target.value)}
						width={360}
					/>
					<div className="flex items-center gap-2.5 mt-3">
						<Button
							size="sm"
							onClick={request}
							disabled={busy || newEmail.trim().length === 0}
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
		</section>
	);
}
