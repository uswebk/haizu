import type { EmailMessage, EmailSender } from ".";

// 実送信を行わず、コンソールに出力するだけの開発用アダプタ。
// 確認コード・招待リンク・パスワードリセットの内容はサーバーログで確認する。
export class ConsoleEmailSender implements EmailSender {
	async send({ to, subject, body }: EmailMessage): Promise<void> {
		console.log(
			`\n[email:console] to=${to}\n  subject: ${subject}\n  ${body}\n`,
		);
	}
}
