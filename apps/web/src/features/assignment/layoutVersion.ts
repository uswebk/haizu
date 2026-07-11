import type { VersionState } from "#/features/editor/types";

// The spec applied in assignment on the target date = among published versions with an effective date on or before the target date,
// the one with the newest effective date (ties broken by the larger version number)
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
