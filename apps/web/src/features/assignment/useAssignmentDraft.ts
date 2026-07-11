import type { Assignment } from "@haizu/shared";
import { useRef, useState } from "react";

// Draft placement state (spotId -> employeeId), seeded from the server assignment.
// The seed is a lazy useState initializer, so callers must remount (via key) to reset
// when the target date / shift / spec version changes.
export function useAssignmentDraft(serverAssignment: Assignment | null) {
	const [assign, setAssign] = useState<Record<string, string>>(() => {
		const next: Record<string, string> = {};
		for (const sa of serverAssignment?.spotAssignments ?? []) {
			next[sa.spotId] = sa.employeeId;
		}
		return next;
	});
	const dragId = useRef<string | null>(null);

	const assignToSpot = (spotId: string, empId: string) => {
		setAssign((prev) => {
			const next = { ...prev };
			let oldSpotId: string | null = null;
			for (const [sid, eid] of Object.entries(next)) {
				if (eid === empId) {
					oldSpotId = sid;
					delete next[sid];
				}
			}
			const bumpedEmpId = next[spotId];
			next[spotId] = empId;
			if (bumpedEmpId && bumpedEmpId !== empId && oldSpotId) {
				next[oldSpotId] = bumpedEmpId;
			}
			return next;
		});
	};
	const unassignSpot = (spotId: string) =>
		setAssign((prev) => {
			const next = { ...prev };
			delete next[spotId];
			return next;
		});
	const unassignEmp = (empId: string) =>
		setAssign((prev) => {
			const next = { ...prev };
			for (const [sid, eid] of Object.entries(next)) {
				if (eid === empId) delete next[sid];
			}
			return next;
		});
	const onDropToPool = (e: React.DragEvent) => {
		e.preventDefault();
		if (dragId.current) unassignEmp(dragId.current);
		dragId.current = null;
	};

	return {
		assign,
		dragId,
		assignToSpot,
		unassignSpot,
		unassignEmp,
		onDropToPool,
	};
}
