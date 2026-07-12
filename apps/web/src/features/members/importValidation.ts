import i18n from "#/i18n/config";
import type { ParsedMemberRow } from "./csv";
import type { MemberRow } from "./types";

export type InvitePreviewRow = {
	line: number;
	name: string;
	email: string;
	errors: string[];
	// Only rows without errors are invited. The value used for the request
	input: InviteCsvEntry | null;
};

export type InviteCsvEntry = {
	lastName: string;
	firstName: string;
	email: string;
};

export type InvitePreview = {
	rows: InvitePreviewRow[];
	validCount: number;
	errorCount: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email uniqueness is checked case-insensitively, matching how a mailbox is addressed
const norm = (email: string) => email.toLowerCase();

export function validateInvites(
	parsed: ParsedMemberRow[],
	existing: MemberRow[],
): InvitePreview {
	const existingEmails = new Set(existing.map((m) => norm(m.email)));

	// Pre-count emails duplicated within the CSV (mark all matching rows as errors)
	const emailCounts = new Map<string, number>();
	for (const p of parsed) {
		if (p.email) {
			const key = norm(p.email);
			emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1);
		}
	}

	const rows: InvitePreviewRow[] = parsed.map((p) => {
		const errors: string[] = [];
		const key = norm(p.email);

		if (!p.lastName) errors.push(i18n.t("members:import.errLastNameEmpty"));
		if (!p.email) {
			errors.push(i18n.t("members:import.errEmailEmpty"));
		} else if (!EMAIL_PATTERN.test(p.email)) {
			errors.push(i18n.t("members:import.errEmailInvalid"));
		} else {
			if ((emailCounts.get(key) ?? 0) > 1) {
				errors.push(i18n.t("members:import.errEmailDuplicateInCsv"));
			}
			if (existingEmails.has(key)) {
				errors.push(i18n.t("members:import.errEmailAlreadyMember"));
			}
		}

		return {
			line: p.line,
			name: `${p.lastName} ${p.firstName}`.trim(),
			email: p.email,
			errors,
			input:
				errors.length === 0
					? {
							lastName: p.lastName,
							firstName: p.firstName,
							email: p.email,
						}
					: null,
		};
	});

	const errorCount = rows.filter((r) => r.errors.length > 0).length;
	return {
		rows,
		validCount: rows.length - errorCount,
		errorCount,
	};
}
