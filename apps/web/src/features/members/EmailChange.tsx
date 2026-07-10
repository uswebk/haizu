import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import { requestEmailChangeOtp, verifyEmailChangeOtp } from "#/lib/api/account";
import { memberKeys } from "#/lib/api/members";

export function EmailChange({ currentEmail }: { currentEmail: string }) {
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
			setError(e instanceof Error ? e.message : "エラーが発生しました");
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
			showSuccess("メールアドレスを変更しました");
		} catch (e) {
			setError(e instanceof Error ? e.message : "エラーが発生しました");
		} finally {
			setBusy(false);
		}
	};

	if (!open) {
		return (
			<div className="flex items-center justify-between gap-3">
				<div>
					<div className="text-[13px] font-bold">メールアドレス</div>
					<div className="text-xs text-faint mt-0.5">{currentEmail}</div>
				</div>
				<Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
					変更
				</Button>
			</div>
		);
	}

	return (
		<div>
			<div className="text-[13px] font-bold mb-2.5">メールアドレスの変更</div>
			{step === "input" ? (
				<>
					<Input
						label="新しいメールアドレス"
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
							{busy ? "送信中…" : "確認コードを送る"}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={reset}
							disabled={busy}
						>
							キャンセル
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
						宛に確認コードを送信しました。
					</div>
					<Input
						label="確認コード"
						value={otp}
						placeholder="6桁のコード"
						onChange={(e) => setOtp(e.target.value)}
						width={200}
					/>
					<div className="flex items-center gap-2.5 mt-3">
						<Button
							size="sm"
							onClick={verify}
							disabled={busy || otp.trim().length === 0}
						>
							{busy ? "確認中…" : "変更を確定する"}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setStep("input")}
							disabled={busy}
						>
							戻る
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
