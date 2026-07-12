export type VersionForResolution = {
	id: string;
	version: number;
	status: "draft" | "published";
	effectiveDate: string | null;
};

// A published version applies from its effective date onward. Drafts are never applied on-site.
export function isUsableForDate(
	version: Pick<VersionForResolution, "status" | "effectiveDate">,
	date: string,
): boolean {
	return (
		version.status === "published" &&
		version.effectiveDate !== null &&
		version.effectiveDate <= date
	);
}

// The spec applied in assignment on the given date = among the usable versions,
// the one with the newest effective date (ties broken by the larger version number)
export function resolveCurrentVersion<T extends VersionForResolution>(
	versions: T[],
	date: string,
): T | null {
	return versions.filter((v) => isUsableForDate(v, date)).sort(byEffectiveDateDesc)[0] ?? null;
}

// Newest effective date first. A version with no effective date (a draft) ranks ahead of dated ones,
// matching Postgres' NULLS FIRST on a DESC sort.
function byEffectiveDateDesc(a: VersionForResolution, b: VersionForResolution) {
	if (a.effectiveDate === b.effectiveDate) return b.version - a.version;
	if (a.effectiveDate === null) return -1;
	if (b.effectiveDate === null) return 1;
	return b.effectiveDate.localeCompare(a.effectiveDate);
}

// What the area list shows for a date: the applied version, or else the latest one
// (a brand-new area only has a draft, and the list still has to show it)
export function resolveListedVersion<T extends VersionForResolution>(
	versions: T[],
	date: string,
): T | null {
	const current = resolveCurrentVersion(versions, date);
	if (current) return current;

	return [...versions].sort(byEffectiveDateDesc)[0] ?? null;
}
