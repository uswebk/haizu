import type { EmployeeInput } from "#/lib/api/employees";
import type { Tag } from "#/lib/api/tags";
import { MAX_TAGS, type ParsedEmployeeRow } from "./csv";
import { DEFAULT_AVATAR_COLOR, isValidAvatarColor } from "./palette";
import type { EmployeeRow } from "./types";

export type PreviewRow = {
	line: number;
	code: string;
	name: string;
	tagNames: string[];
	isActive: boolean;
	errors: string[];
	// Only rows without errors are committed. The value used for the import request
	input: EmployeeInput | null;
};

export type ImportPreview = {
	rows: PreviewRow[];
	validCount: number;
	errorCount: number;
};

export function validateImport(
	parsed: ParsedEmployeeRow[],
	existing: EmployeeRow[],
	tags: Tag[],
): ImportPreview {
	const existingCodes = new Set(existing.map((e) => e.code));
	const tagIdByName = new Map(tags.map((t) => [t.name, t.id]));

	// Pre-count codes duplicated within the CSV (mark all matching rows as errors)
	const codeCounts = new Map<string, number>();
	for (const p of parsed) {
		if (p.code) codeCounts.set(p.code, (codeCounts.get(p.code) ?? 0) + 1);
	}

	const rows: PreviewRow[] = parsed.map((p) => {
		const errors: string[] = [];

		if (!p.code) errors.push("Employee code is empty");
		if (!p.lastName) errors.push("Last name is empty");
		if (!p.firstName) errors.push("First name is empty");

		if (p.code && (codeCounts.get(p.code) ?? 0) > 1) {
			errors.push("Duplicate employee code within the CSV");
		}
		if (p.code && existingCodes.has(p.code)) {
			errors.push("Employee code duplicates an existing employee");
		}

		if (p.hasExcessTags || p.tagNames.length > MAX_TAGS) {
			errors.push(`Up to ${MAX_TAGS} tags allowed`);
		}

		const tagIds: string[] = [];
		const unknownTags: string[] = [];
		for (const name of p.tagNames) {
			const id = tagIdByName.get(name);
			if (id) tagIds.push(id);
			else unknownTags.push(name);
		}
		if (unknownTags.length > 0) {
			errors.push(`Unregistered tags: ${unknownTags.join(", ")}`);
		}

		const avatarColor = isValidAvatarColor(p.avatarColor)
			? p.avatarColor
			: DEFAULT_AVATAR_COLOR;

		const input: EmployeeInput | null =
			errors.length === 0
				? {
						code: p.code,
						lastName: p.lastName,
						firstName: p.firstName,
						avatarColor,
						tagIds,
						isActive: p.isActive,
					}
				: null;

		return {
			line: p.line,
			code: p.code,
			name: `${p.lastName} ${p.firstName}`.trim(),
			tagNames: p.tagNames,
			isActive: p.isActive,
			errors,
			input,
		};
	});

	const errorCount = rows.filter((r) => r.errors.length > 0).length;
	return {
		rows,
		validCount: rows.length - errorCount,
		errorCount,
	};
}
