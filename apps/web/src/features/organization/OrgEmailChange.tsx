import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import {
	fetchOrganization,
	organizationKeys,
	requestOrgEmailOtp,
	verifyOrgEmailOtp,
} from "#/lib/api/organizations";

export function OrgEmailChange() {
	const queryClient = useQueryClient();
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
	const [done, setDone] = useState(false);

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
			setError(e instanceof Error ? e.message : "エラーが発生しました");
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
			setDone(true);
			await queryClient.invalidateQueries({
				queryKey: organizationKeys.detail,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "エラーが発生しました");
		} finally {
			setBusy(false);
		}
	};

	const current = organization?.email ?? "未設定";

	return (
		<section className="bg-surface border border-border rounded-lg p-5.5 shadow-card mt-5">
			<div className="font-bold text-[15px] mb-3.5">連絡先メールアドレス</div>

			{!open ? (
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="text-[13px] text-ink">{current}</div>
						{done && (
							<div className="text-xs font-semibold text-success mt-1">
								連絡先メールアドレスを変更しました。
							</div>
						)}
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							setDone(false);
							setOpen(true);
						}}
					>
						変更
					</Button>
				</div>
			) : step === "input" ? (
				<>
					<Input
						label="新しい連絡先メールアドレス"
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
		</section>
	);
}
