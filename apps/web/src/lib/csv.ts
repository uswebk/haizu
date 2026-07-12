export const CSV_BOM = "﻿";

export function escapeCsvCell(value: string): string {
	if (/[",\r\n]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

// Minimal RFC4180-compliant parser. Correctly handles commas, newlines, and "" inside quotes.
export function parseCsv(text: string): string[][] {
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

// Build a CSV body with a BOM so Excel opens UTF-8 correctly
export function toCsv(rows: string[][]): string {
	return CSV_BOM + rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
}
