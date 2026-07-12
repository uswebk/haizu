export type ExistingShift = {
	id: string;
	name: string;
	startTime: string;
	endTime: string;
};

export type DesiredShift = {
	id?: string;
	name: string;
	startTime: string;
	endTime: string;
};

export type ShiftDiff = {
	// Unchanged rows. Only their order is updated
	kept: { id: string; order: number }[];
	toInsert: {
		name: string;
		startTime: string;
		endTime: string;
		order: number;
	}[];
	softDelete: string[];
};

// Shifts are versioned by soft delete: a changed shift becomes a new row so that assignments
// keep pointing at the shift they were made against.
// Names are unique within the current shifts. Even if the id is stale/missing, match existing rows by name
// so unchanged rows aren't mistakenly soft-deleted + re-inserted.
export function diffShifts(
	existing: ExistingShift[],
	desired: DesiredShift[],
): ShiftDiff {
	const existingById = new Map(existing.map((r) => [r.id, r]));
	const existingByName = new Map(existing.map((r) => [r.name, r]));

	const handled = new Set<string>();
	const kept: ShiftDiff["kept"] = [];
	const toInsert: ShiftDiff["toInsert"] = [];
	const softDelete = new Set<string>();

	desired.forEach((s, i) => {
		const match =
			(s.id ? existingById.get(s.id) : undefined) ?? existingByName.get(s.name);
		// An existing row is consumed at most once, so duplicate names in the input insert new rows
		if (match && !handled.has(match.id)) {
			handled.add(match.id);
			if (
				match.name === s.name &&
				match.startTime === s.startTime &&
				match.endTime === s.endTime
			) {
				kept.push({ id: match.id, order: i });
				return;
			}
			softDelete.add(match.id);
		}
		toInsert.push({
			name: s.name,
			startTime: s.startTime,
			endTime: s.endTime,
			order: i,
		});
	});

	for (const id of existingById.keys()) {
		if (!handled.has(id)) softDelete.add(id);
	}

	return { kept, toInsert, softDelete: [...softDelete] };
}
