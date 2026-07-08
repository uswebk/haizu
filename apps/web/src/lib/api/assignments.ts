import type { Assignment, AssignmentInput } from "@haizu/shared";
import { API_BASE, apiFetch } from ".";

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
	const res = await apiFetch(`${API_BASE}/assignments?${query.toString()}`);
	const data = await handleResponse<{ assignments: Assignment[] }>(res);
	return data.assignments;
}

export async function saveAssignment(
	input: AssignmentInput,
): Promise<Assignment> {
	const res = await apiFetch(`${API_BASE}/assignments`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<Assignment>(res);
}

export async function fetchShiftMismatch(date: string): Promise<boolean> {
	const res = await apiFetch(
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
	list: (date: string, page: number) =>
		["assignments", "history", date, page] as const,
};

export async function fetchAssignmentHistory(params: {
	date: string;
	limit: number;
	offset: number;
}): Promise<HistoryPage> {
	const q = new URLSearchParams({
		date: params.date,
		limit: String(params.limit),
		offset: String(params.offset),
	});
	const res = await apiFetch(`${API_BASE}/assignments/history?${q.toString()}`);
	return handleResponse<HistoryPage>(res);
}

// エリアで確定済み配置に紐づいたことのあるシフト（削除済み含む）
export type UsedShift = {
	id: string;
	name: string;
	startTime: string;
	endTime: string;
	order: number;
	deleted: boolean;
};

export async function fetchShiftsUsed(
	areaId: string,
	date?: string,
): Promise<UsedShift[]> {
	const q = new URLSearchParams({ areaId });
	if (date) q.set("date", date);
	const res = await apiFetch(
		`${API_BASE}/assignments/shifts-used?${q.toString()}`,
	);
	const data = await handleResponse<{ shifts: UsedShift[] }>(res);
	return data.shifts;
}
