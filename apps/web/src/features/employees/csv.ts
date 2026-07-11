import i18n from "#/i18n/config";
import type { EmployeeRow } from "./types";

export const MAX_TAGS = 10;

const BOM = "﻿";

function buildCsvHeaders(): string[] {
	return [
		i18n.t("employees:csv.colCode"),
		i18n.t("employees:csv.colLastName"),
		i18n.t("employees:csv.colFirstName"),
		i18n.t("employees:csv.colAvatarColor"),
		i18n.t("employees:csv.colStatus"),
		...Array.from({ length: MAX_TAGS }, (_, i) =>
			i18n.t("employees:csv.colTag", { n: i + 1 }),
		),
	];
}

export const ACTIVE_LABEL = "Active";
export const INACTIVE_LABEL = "Inactive";

export type ParsedEmployeeRow = {
	// Original CSV row number (1-based, excluding the header). Used for preview error display
	line: number;
	code: string;
	lastName: string;
	firstName: string;
	avatarColor: string;
	isActive: boolean;
	tagNames: string[];
	// Overflow flag for when the tag columns (11th onward) have values
	hasExcessTags: boolean;
};

function escapeCell(value: string): string {
	if (/[",\r\n]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function employeesToCsv(rows: EmployeeRow[]): string {
	const lines = [buildCsvHeaders().join(",")];
	for (const e of rows) {
		const tagNames = e.tags.slice(0, MAX_TAGS).map((t) => t.name);
		const cells = [
			e.code,
			e.lastName,
			e.firstName,
			e.avatarColor,
			e.isActive ? ACTIVE_LABEL : INACTIVE_LABEL,
			...Array.from({ length: MAX_TAGS }, (_, i) => tagNames[i] ?? ""),
		];
		lines.push(cells.map(escapeCell).join(","));
	}
	return BOM + lines.join("\r\n");
}

// Minimal RFC4180-compliant parser. Correctly handles commas, newlines, and "" inside quotes.
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let inQuotes = false;
	let i = 0;

	// Strip a leading BOM
	if (text.charCodeAt(0) === 0xfeff) i = 1;

	const pushCell = () => {
		row.push(cell);
		cell = "";
	};
	const pushRow = () => {
		pushCell();
		rows.push(row);
		row = [];
	};

	while (i < text.length) {
		const ch = text[i];
		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i += 2;
				} else {
					inQuotes = false;
					i += 1;
				}
			} else {
				cell += ch;
				i += 1;
			}
		} else if (ch === '"') {
			inQuotes = true;
			i += 1;
		} else if (ch === ",") {
			pushCell();
			i += 1;
		} else if (ch === "\r") {
			// Treat both \r\n and \r as a line break
			pushRow();
			i += text[i + 1] === "\n" ? 2 : 1;
		} else if (ch === "\n") {
			pushRow();
			i += 1;
		} else {
			cell += ch;
			i += 1;
		}
	}
	// Final cell. Drop fully empty rows (from a trailing newline)
	if (cell.length > 0 || row.length > 0) pushRow();

	return rows;
}

export function parseEmployeesCsv(text: string): ParsedEmployeeRow[] {
	const table = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
	if (table.length === 0) return [];

	// Read the header row by fixed column index, not by label order
	const body = table.slice(1);

	return body.map((cells, idx) => {
		const get = (col: number) => (cells[col] ?? "").trim();
		const statusRaw = get(4);
		const tagNames: string[] = [];
		for (let t = 0; t < MAX_TAGS; t++) {
			const name = get(5 + t);
			if (name) tagNames.push(name);
		}
		let hasExcessTags = false;
		for (let col = 5 + MAX_TAGS; col < cells.length; col++) {
			if ((cells[col] ?? "").trim() !== "") {
				hasExcessTags = true;
				break;
			}
		}
		return {
			line: idx + 1,
			code: get(0),
			lastName: get(1),
			firstName: get(2),
			avatarColor: get(3),
			isActive: statusRaw !== INACTIVE_LABEL,
			tagNames,
			hasExcessTags,
		};
	});
}
