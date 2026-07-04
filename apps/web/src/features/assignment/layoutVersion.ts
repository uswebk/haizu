import type { VersionState } from "#/features/editor/types";

// 対象日に配置決めで適用される規格 = 公開済みかつ適用開始日が対象日以前のもののうち、
// 適用開始日が最も新しいもの（同日ならバージョン番号が大きい方が優先）
export function resolveVersionForDate(
	versions: VersionState[],
	date: string,
): VersionState | null {
	const candidates = versions.filter(
		(v) => v.status === "published" && v.effectiveDate <= date,
	);
	if (candidates.length === 0) return null;
	candidates.sort((a, b) => {
		if (a.effectiveDate !== b.effectiveDate) {
			return b.effectiveDate.localeCompare(a.effectiveDate);
		}
		return versionNumber(b) - versionNumber(a);
	});
	return candidates[0];
}

function versionNumber(v: VersionState): number {
	return Number(v.label.replace(/^v/, ""));
}
