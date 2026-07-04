import type { Assignment, AssignmentInput } from "@haiz/shared";
import { API_BASE } from ".";

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<T>;
}

export const assignmentKeys = {
	byDateShift: (date: string, shiftId: string | null) =>
		["assignments", date, shiftId ?? "none"] as const,
};

export async function fetchAssignments(params: {
	date: string;
	shiftId: string | null;
}): Promise<Assignment[]> {
	const query = new URLSearchParams({ date: params.date });
	if (params.shiftId) query.set("shiftId", params.shiftId);
	const res = await fetch(`${API_BASE}/assignments?${query.toString()}`);
	const data = await handleResponse<{ assignments: Assignment[] }>(res);
	return data.assignments;
}

export async function saveAssignment(
	input: AssignmentInput,
): Promise<Assignment> {
	const res = await fetch(`${API_BASE}/assignments`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<Assignment>(res);
}
