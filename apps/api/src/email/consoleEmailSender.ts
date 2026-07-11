import type { EmailMessage, EmailSender } from ".";

// Dev adapter that doesn't actually send; it only prints to the console.
// Check verification codes, invite links, and password resets in the server logs.
export class ConsoleEmailSender implements EmailSender {
	async send({ to, subject, body }: EmailMessage): Promise<void> {
		console.log(
			`\n[email:console] to=${to}\n  subject: ${subject}\n  ${body}\n`,
		);
	}
}
