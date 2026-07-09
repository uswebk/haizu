import { API_BASE, apiFetch, handleResponse } from ".";

export type Tag = {
	id: string;
	name: string;
	employeeCount: number;
};

export const tagKeys = {
	all: ["tags"] as const,
};

export async function fetchTags(): Promise<Tag[]> {
	const res = await apiFetch(`${API_BASE}/tags`);
	const data = await handleResponse<{ tags: Tag[] }>(res);
	return data.tags;
}

export async function createTag(
	name: string,
): Promise<{ id: string; name: string }> {
	const res = await apiFetch(`${API_BASE}/tags`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return handleResponse(res);
}

export async function updateTag(
	id: string,
	name: string,
): Promise<{ id: string; name: string }> {
	const res = await apiFetch(`${API_BASE}/tags/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return handleResponse(res);
}

export async function deleteTag(id: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/tags/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error(`API error: ${res.status}`);
}
