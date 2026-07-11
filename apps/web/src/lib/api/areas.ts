import type { LayoutSpecStatus } from "@haizu/shared";
import type { AreaData, SpotState } from "#/features/editor/types";
import { todayStr } from "#/lib/datetime";
import { API_BASE, apiFetch, handleResponse } from ".";

export type AreaListItem = {
	id: string;
	name: string;
	floorPlanName: string | null;
	spotCount: number;
	currentVersion: string | null;
	currentStatus: LayoutSpecStatus | null;
};

export const areaKeys = {
	all: ["areas"] as const,
	detail: (id: string) => ["areas", id] as const,
	versionSpots: (areaId: string, versionId: string) =>
		["areas", areaId, "versions", versionId, "spots"] as const,
};

export async function fetchAreas(date?: string): Promise<AreaListItem[]> {
	// The spec version's "today" is based on the device-TZ today (leaving it to the API would use UTC).
	const target = date ?? todayStr();
	const res = await apiFetch(`${API_BASE}/areas?date=${target}`);
	const data = await handleResponse<{ areas: AreaListItem[] }>(res);
	return data.areas;
}

export async function fetchArea(id: string): Promise<AreaData> {
	const res = await apiFetch(`${API_BASE}/areas/${id}`);
	return handleResponse<AreaData>(res);
}

export async function fetchVersionSpots(
	areaId: string,
	versionId: string,
): Promise<SpotState[]> {
	const res = await apiFetch(
		`${API_BASE}/areas/${areaId}/versions/${versionId}/spots`,
	);
	const data = await handleResponse<{ spots: SpotState[] }>(res);
	return data.spots;
}

export async function createArea(
	name: string,
): Promise<{ id: string; name: string }> {
	const res = await apiFetch(`${API_BASE}/areas`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return handleResponse(res);
}

export async function deleteArea(id: string): Promise<void> {
	const res = await apiFetch(`${API_BASE}/areas/${id}`, { method: "DELETE" });
	await handleResponse(res);
}

export type SaveDraftParams = {
	areaId: string;
	versionId: string;
	spots: { id?: string; label: string; x: number; y: number; size: number }[];
	imageScale?: number;
};

export async function saveAreaDraft({
	areaId,
	versionId,
	spots,
	imageScale,
}: SaveDraftParams): Promise<void> {
	const res = await apiFetch(
		`${API_BASE}/areas/${areaId}/versions/${versionId}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ spots, imageScale }),
		},
	);
	await handleResponse(res);
}

export async function uploadFloorPlan({
	areaId,
	versionId,
	file,
}: {
	areaId: string;
	versionId: string;
	file: File;
}): Promise<{ url: string; name: string; aspectRatio: number | null }> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await apiFetch(
		`${API_BASE}/areas/${areaId}/versions/${versionId}/floor-plan`,
		{ method: "POST", body: formData },
	);
	return handleResponse(res);
}

export async function deleteFloorPlan(params: {
	areaId: string;
	versionId: string;
}): Promise<void> {
	const res = await apiFetch(
		`${API_BASE}/areas/${params.areaId}/versions/${params.versionId}/floor-plan`,
		{ method: "DELETE" },
	);
	await handleResponse(res);
}

export async function publishVersion(params: {
	areaId: string;
	versionId: string;
	effectiveDate: string;
}): Promise<void> {
	const res = await apiFetch(
		`${API_BASE}/areas/${params.areaId}/versions/${params.versionId}/publish`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ effectiveDate: params.effectiveDate }),
		},
	);
	await handleResponse(res);
}

export async function duplicateVersion(params: {
	areaId: string;
	versionId: string;
	spots: { label: string; x: number; y: number; size: number }[];
	imageScale?: number;
}): Promise<{ id: string; label: string }> {
	const res = await apiFetch(
		`${API_BASE}/areas/${params.areaId}/versions/${params.versionId}/duplicate`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				spots: params.spots,
				imageScale: params.imageScale,
			}),
		},
	);
	return handleResponse(res);
}

export async function unpublishVersion(params: {
	areaId: string;
	versionId: string;
}): Promise<void> {
	const res = await apiFetch(
		`${API_BASE}/areas/${params.areaId}/versions/${params.versionId}/unpublish`,
		{ method: "POST" },
	);
	await handleResponse(res);
}
