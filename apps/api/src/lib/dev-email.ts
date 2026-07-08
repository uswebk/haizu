// メール送信は未実装のため、開発用スタブとしてコンソールに出力する。
// 将来 OTP・招待・パスワードリセットを実装する際に実送信へ差し替える。
export function devSendEmail(to: string, subject: string, body: string) {
	console.log(`\n[dev-email] to=${to}\n  subject: ${subject}\n  ${body}\n`);
}
