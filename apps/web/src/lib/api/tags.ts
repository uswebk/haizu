import { API_BASE } from ".";

export type Tag = {
	id: string;
	name: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<T>;
}

export const tagKeys = {
	all: ["tags"] as const,
};

export async function fetchTags(): Promise<Tag[]> {
	const res = await fetch(`${API_BASE}/tags`);
	const data = await handleResponse<{ tags: Tag[] }>(res);
	return data.tags;
}
