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
	// エラーが無い行のみ確定する。取込送信用の値
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

	// CSV内で重複しているコードを事前集計（該当行すべてをエラーにする）
	const codeCounts = new Map<string, number>();
	for (const p of parsed) {
		if (p.code) codeCounts.set(p.code, (codeCounts.get(p.code) ?? 0) + 1);
	}

	const rows: PreviewRow[] = parsed.map((p) => {
		const errors: string[] = [];

		if (!p.code) errors.push("社員番号が空です");
		if (!p.lastName) errors.push("姓が空です");
		if (!p.firstName) errors.push("名が空です");

		if (p.code && (codeCounts.get(p.code) ?? 0) > 1) {
			errors.push("CSV内で社員番号が重複しています");
		}
		if (p.code && existingCodes.has(p.code)) {
			errors.push("社員番号が既存の従業員と重複しています");
		}

		if (p.hasExcessTags || p.tagNames.length > MAX_TAGS) {
			errors.push(`タグは${MAX_TAGS}個までです`);
		}

		const tagIds: string[] = [];
		const unknownTags: string[] = [];
		for (const name of p.tagNames) {
			const id = tagIdByName.get(name);
			if (id) tagIds.push(id);
			else unknownTags.push(name);
		}
		if (unknownTags.length > 0) {
			errors.push(`未登録のタグ: ${unknownTags.join("、")}`);
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
