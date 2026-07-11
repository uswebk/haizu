import { MIN_PASSWORD_LENGTH } from "@haizu/shared";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import { authClient } from "#/lib/auth-client";

export function PasswordChange() {
	const { t } = useTranslation(["members", "common", "auth"]);
	const { showSuccess } = useSnackbar();
	const [open, setOpen] = useState(false);
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setOpen(false);
		setCurrent("");
		setNext("");
		setConfirm("");
		setError(null);
	};

	const submit = async () => {
		if (next.length < MIN_PASSWORD_LENGTH) {
			setError(t("auth:forgot.passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
			return;
		}
		if (next !== confirm) {
			setError(t("auth:forgot.passwordMismatch"));
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const { error: err } = await authClient.changePassword({
				currentPassword: current,
				newPassword: next,
				// Invalidate sessions on other devices after the change
				revokeOtherSessions: true,
			});
			if (err)
				throw new Error(err.message ?? t("members:password.changeFailed"));
			reset();
			showSuccess(t("members:password.changed"));
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
					<div className="text-[13px] font-bold">{t("common:password")}</div>
					<div className="text-xs text-faint mt-0.5">••••••••</div>
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
				{t("members:password.changeTitle")}
			</div>
			<div className="flex flex-col gap-2.5">
				<Input
					label={t("members:password.current")}
					type="password"
					value={current}
					onChange={(e) => setCurrent(e.target.value)}
					width={320}
				/>
				<Input
					label={t("auth:forgot.newPassword")}
					type="password"
					value={next}
					placeholder={t("auth:forgot.minChars", { min: MIN_PASSWORD_LENGTH })}
					onChange={(e) => setNext(e.target.value)}
					width={320}
				/>
				<Input
					label={t("auth:forgot.newPasswordConfirm")}
					type="password"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					width={320}
				/>
			</div>
			<div className="flex items-center gap-2.5 mt-3">
				<Button
					size="sm"
					onClick={submit}
					disabled={
						busy ||
						current.length === 0 ||
						next.length === 0 ||
						confirm.length === 0
					}
				>
					{busy ? t("members:password.changing") : t("common:change")}
				</Button>
				<Button variant="secondary" size="sm" onClick={reset} disabled={busy}>
					{t("common:cancel")}
				</Button>
				{error && (
					<span className="text-xs font-semibold text-danger">{error}</span>
				)}
			</div>
		</div>
	);
}
