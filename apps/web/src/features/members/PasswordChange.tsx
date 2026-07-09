import { useState } from "react";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { authClient } from "#/lib/auth-client";

// auth.ts の minPasswordLength と揃える
const MIN_PASSWORD_LENGTH = 8;

export function PasswordChange() {
	const [open, setOpen] = useState(false);
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const reset = () => {
		setOpen(false);
		setCurrent("");
		setNext("");
		setConfirm("");
		setError(null);
	};

	const submit = async () => {
		if (next.length < MIN_PASSWORD_LENGTH) {
			setError(`パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください`);
			return;
		}
		if (next !== confirm) {
			setError("確認用パスワードが一致しません");
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const { error: err } = await authClient.changePassword({
				currentPassword: current,
				newPassword: next,
				// 変更後は他デバイスのセッションを無効化する
				revokeOtherSessions: true,
			});
			if (err) throw new Error(err.message ?? "パスワード変更に失敗しました");
			reset();
			setDone(true);
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
					<div className="text-[13px] font-bold">パスワード</div>
					<div className="text-xs text-faint mt-0.5">••••••••</div>
					{done && (
						<div className="text-xs font-semibold text-success mt-1">
							パスワードを変更しました。
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
		);
	}

	return (
		<div>
			<div className="text-[13px] font-bold mb-2.5">パスワードの変更</div>
			<div className="flex flex-col gap-2.5">
				<Input
					label="現在のパスワード"
					type="password"
					value={current}
					onChange={(e) => setCurrent(e.target.value)}
					width={320}
				/>
				<Input
					label="新しいパスワード"
					type="password"
					value={next}
					placeholder={`${MIN_PASSWORD_LENGTH}文字以上`}
					onChange={(e) => setNext(e.target.value)}
					width={320}
				/>
				<Input
					label="新しいパスワード（確認）"
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
					{busy ? "変更中…" : "変更する"}
				</Button>
				<Button variant="secondary" size="sm" onClick={reset} disabled={busy}>
					キャンセル
				</Button>
				{error && (
					<span className="text-xs font-semibold text-danger">{error}</span>
				)}
			</div>
		</div>
	);
}
