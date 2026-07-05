import type { EmployeeRow } from "#/features/employees/types";
import { API_BASE, apiFetch } from ".";

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		const message =
			body &&
			typeof body === "object" &&
			"error" in body &&
			typeof body.error === "string"
				? body.error
				: `API error: ${res.status}`;
		throw new Error(message);
	}
	return res.json() as Promise<T>;
}

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
