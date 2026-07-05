import type { ViewerConfig, ViewerConfigInput } from "@haiz/shared";
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

export const viewerConfigKeys = {
	all: ["viewer-configs"] as const,
};

export async function fetchViewerConfigs(): Promise<ViewerConfig[]> {
	const res = await apiFetch(`${API_BASE}/viewer-configs`);
	const data = await handleResponse<{ configs: ViewerConfig[] }>(res);
	return data.configs;
}

export async function saveViewerConfig(
	areaId: string,
	input: ViewerConfigInput,
): Promise<ViewerConfig> {
	const res = await apiFetch(`${API_BASE}/viewer-configs/${areaId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<ViewerConfig>(res);
}
