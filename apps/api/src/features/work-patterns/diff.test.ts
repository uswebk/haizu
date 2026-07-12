import { describe, expect, it } from "vitest";
import { diffShifts, type ExistingShift } from "./diff";

function shift(id: string, name: string, startTime = "09:00", endTime = "18:00"): ExistingShift {
	return { id, name, startTime, endTime };
}

describe("diffShifts", () => {
	it("keeps an unchanged shift and only updates its order", () => {
		const existing = [shift("a", "Day"), shift("b", "Night", "18:00", "03:00")];
		const diff = diffShifts(existing, [
			{ id: "b", name: "Night", startTime: "18:00", endTime: "03:00" },
			{ id: "a", name: "Day", startTime: "09:00", endTime: "18:00" },
		]);

		expect(diff.kept).toEqual([
			{ id: "b", order: 0 },
			{ id: "a", order: 1 },
		]);
		expect(diff.toInsert).toEqual([]);
		expect(diff.softDelete).toEqual([]);
	});

	it("soft-deletes and re-inserts a shift whose time changed", () => {
		const diff = diffShifts(
			[shift("a", "Day", "09:00", "18:00")],
			[{ id: "a", name: "Day", startTime: "08:00", endTime: "17:00" }],
		);

		expect(diff.kept).toEqual([]);
		expect(diff.softDelete).toEqual(["a"]);
		expect(diff.toInsert).toEqual([
			{ name: "Day", startTime: "08:00", endTime: "17:00", order: 0 },
		]);
	});

	it("matches by name when the id is missing", () => {
		const diff = diffShifts(
			[shift("a", "Day")],
			[{ name: "Day", startTime: "09:00", endTime: "18:00" }],
		);

		expect(diff.kept).toEqual([{ id: "a", order: 0 }]);
		expect(diff.toInsert).toEqual([]);
	});

	it("soft-deletes existing shifts that are absent from the input", () => {
		const diff = diffShifts([shift("a", "Day"), shift("b", "Night")], [
			{ id: "a", name: "Day", startTime: "09:00", endTime: "18:00" },
		]);

		expect(diff.softDelete).toEqual(["b"]);
	});

	it("soft-deletes everything when the input is empty (e.g. switching to single mode)", () => {
		const diff = diffShifts([shift("a", "Day"), shift("b", "Night")], []);

		expect(diff.softDelete).toEqual(["a", "b"]);
		expect(diff.kept).toEqual([]);
		expect(diff.toInsert).toEqual([]);
	});

	it("consumes an existing row at most once, so a duplicate name inserts a new row", () => {
		const diff = diffShifts(
			[shift("a", "Day")],
			[
				{ name: "Day", startTime: "09:00", endTime: "18:00" },
				{ name: "Day", startTime: "09:00", endTime: "18:00" },
			],
		);

		expect(diff.kept).toEqual([{ id: "a", order: 0 }]);
		expect(diff.toInsert).toEqual([
			{ name: "Day", startTime: "09:00", endTime: "18:00", order: 1 },
		]);
	});

	// Pins today's behavior: removing "Night" and re-adding an identical "Night" in the same save
	// matches the existing row by name, so the original row survives instead of being replaced.
	it("keeps the original row when a shift is removed and re-added unchanged in one save", () => {
		const diff = diffShifts(
			[shift("a", "Day"), shift("b", "Night", "18:00", "03:00")],
			[
				{ id: "a", name: "Day", startTime: "09:00", endTime: "18:00" },
				{ name: "Night", startTime: "18:00", endTime: "03:00" },
			],
		);

		expect(diff.kept).toEqual([
			{ id: "a", order: 0 },
			{ id: "b", order: 1 },
		]);
		expect(diff.softDelete).toEqual([]);
	});
});
