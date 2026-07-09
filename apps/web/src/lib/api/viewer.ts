import type { ViewerConfig, ViewerConfigInput } from "@haizu/shared";
import { API_BASE, apiFetch, handleResponse } from ".";

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
