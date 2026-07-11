import { ConsoleEmailSender } from "./consoleEmailSender";
import { SmtpEmailSender } from "./smtpEmailSender";

export type EmailMessage = {
	to: string;
	subject: string;
	body: string;
};

export interface EmailSender {
	send(message: EmailMessage): Promise<void>;
}

// Switch the send adapter via EMAIL_DRIVER.
//   console: console output (default, zero dependencies)
//   smtp:    SMTP send (Mailpit locally, real SMTP in production)
function createEmailSender(): EmailSender {
	const driver = process.env.EMAIL_DRIVER ?? "console";
	switch (driver) {
		case "console":
			return new ConsoleEmailSender();
		case "smtp":
			return new SmtpEmailSender();
		default:
			throw new Error(
				`Unknown EMAIL_DRIVER: "${driver}". 実装済みは "console" / "smtp" です。他は src/email/ にアダプタを追加してください。`,
			);
	}
}

export const emailSender: EmailSender = createEmailSender();
