import type { EmployeeRow } from "#/features/employees/types";
import { API_BASE, apiFetch, handleResponse } from ".";

export const employeeKeys = {
	all: ["employees"] as const,
};

export async function fetchEmployees(): Promise<EmployeeRow[]> {
	const res = await apiFetch(`${API_BASE}/employees`);
	const data = await handleResponse<{ employees: EmployeeRow[] }>(res);
	return data.employees;
}

export type EmployeeInput = {
	code: string;
	lastName: string;
	firstName: string;
	avatarColor: string;
	tagIds: string[];
	isActive: boolean;
};

export async function createEmployee(
	input: EmployeeInput,
): Promise<EmployeeRow> {
	const res = await apiFetch(`${API_BASE}/employees`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export async function updateEmployee(
	id: string,
	input: EmployeeInput,
): Promise<EmployeeRow> {
	const res = await apiFetch(`${API_BASE}/employees/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse(res);
}

export async function importEmployees(
	rows: EmployeeInput[],
): Promise<{ created: number }> {
	const res = await apiFetch(`${API_BASE}/employees/import`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ employees: rows }),
	});
	return handleResponse(res);
}
