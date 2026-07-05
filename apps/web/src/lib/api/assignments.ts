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

export async function fetchShiftMismatch(date: string): Promise<boolean> {
	const res = await fetch(
		`${API_BASE}/assignments/shift-mismatch?date=${date}`,
	);
	const data = await handleResponse<{ mismatched: boolean }>(res);
	return data.mismatched;
}

// 確定済み配置の履歴1件（一覧テーブル1行分）
export type HistoryEntry = {
	id: string;
	areaId: string;
	areaName: string;
	date: string;
	shiftId: string | null;
	shiftName: string | null;
	layoutSpecVersionId: string;
	employeeIds: string[];
};

export type HistoryPage = { entries: HistoryEntry[]; total: number };

export const historyKeys = {
	list: (date: string | null, page: number) =>
		["assignments", "history", date ?? "all", page] as const,
};

export async function fetchAssignmentHistory(params: {
	date?: string;
	limit: number;
	offset: number;
}): Promise<HistoryPage> {
	const q = new URLSearchParams({
		limit: String(params.limit),
		offset: String(params.offset),
	});
	if (params.date) q.set("date", params.date);
	const res = await fetch(`${API_BASE}/assignments/history?${q.toString()}`);
	return handleResponse<HistoryPage>(res);
}
