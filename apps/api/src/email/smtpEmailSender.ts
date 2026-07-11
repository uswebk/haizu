import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailSender } from ".";

export class SmtpEmailSender implements EmailSender {
	private readonly transporter: Transporter;
	private readonly from: string;

	constructor() {
		const host = process.env.SMTP_HOST;
		if (!host) {
			throw new Error(
				'EMAIL_DRIVER="smtp" には SMTP_HOST が必要です（.env を参照）。',
			);
		}
		const port = Number(process.env.SMTP_PORT ?? 587);
		const user = process.env.SMTP_USER;
		const pass = process.env.SMTP_PASS;
		this.transporter = nodemailer.createTransport({
			host,
			port,
			// 465 のみ implicit TLS。587/1025(Mailpit) は STARTTLS もしくは平文。
			secure: port === 465,
			auth: user && pass ? { user, pass } : undefined,
		});
		this.from = process.env.SMTP_FROM ?? "haizu <no-reply@haizu.local>";
	}

	async send({ to, subject, body }: EmailMessage): Promise<void> {
		await this.transporter.sendMail({
			from: this.from,
			to,
			subject,
			text: body,
		});
	}
}
