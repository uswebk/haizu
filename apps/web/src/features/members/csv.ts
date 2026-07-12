import i18n from "#/i18n/config";
import { parseCsv, toCsv } from "#/lib/csv";

// Each row sends an invitation email, so keep the ceiling well below the employee import
export const MAX_INVITE_ROWS = 200;

export type ParsedMemberRow = {
	// Original CSV row number (1-based, excluding the header). Used for preview error display
	line: number;
	lastName: string;
	firstName: string;
	email: string;
};

function buildCsvHeaders(): string[] {
	return [
		i18n.t("members:csv.colLastName"),
		i18n.t("members:csv.colFirstName"),
		i18n.t("members:csv.colEmail"),
	];
}

export function membersTemplateCsv(): string {
	return toCsv([buildCsvHeaders(), ["山田", "健一", "name@example.com"]]);
}

export function parseMembersCsv(text: string): ParsedMemberRow[] {
	const table = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
	if (table.length === 0) return [];

	// Read cells by fixed column index, not by header label
	const body = table.slice(1);

	return body.map((cells, idx) => {
		const get = (col: number) => (cells[col] ?? "").trim();
		return {
			line: idx + 1,
			lastName: get(0),
			firstName: get(1),
			email: get(2),
		};
	});
}
