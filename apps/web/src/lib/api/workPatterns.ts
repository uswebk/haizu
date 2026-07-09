import type { WorkPattern, WorkPatternInput } from "@haizu/shared";
import { API_BASE, apiFetch, handleResponse } from ".";

export const workPatternKeys = {
	detail: ["work-pattern"] as const,
};

export async function fetchWorkPattern(): Promise<WorkPattern | null> {
	const res = await apiFetch(`${API_BASE}/work-pattern`);
	return handleResponse<WorkPattern | null>(res);
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
