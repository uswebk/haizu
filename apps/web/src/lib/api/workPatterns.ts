import type { WorkPattern, WorkPatternInput } from "@haiz/shared";
import { API_BASE, apiFetch } from ".";

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<T>;
}

export const workPatternKeys = {
	detail: ["work-pattern"] as const,
};

export async function fetchWorkPattern(): Promise<WorkPattern> {
	const res = await apiFetch(`${API_BASE}/work-pattern`);
	return handleResponse<WorkPattern>(res);
}

export async function saveWorkPattern(
	input: WorkPatternInput,
): Promise<WorkPattern> {
	const res = await apiFetch(`${API_BASE}/work-pattern`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<WorkPattern>(res);
}
