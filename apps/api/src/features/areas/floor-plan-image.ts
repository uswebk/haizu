import { imageSize } from "image-size";

// Whitelist of formats detected by image-size. Uploads are served as-is from /uploads,
// so anything that can execute scripts on the API origin (HTML, SVG, ...) must be rejected.
const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
	png: ".png",
	jpg: ".jpg",
	webp: ".webp",
};

export type FloorPlanImage = {
	extension: string;
	aspectRatio: number;
};

// Validates by content, not the client-supplied filename/MIME type.
// Returns null when the buffer is not a supported raster image.
export function parseFloorPlanImage(buffer: Buffer): FloorPlanImage | null {
	let dimensions: ReturnType<typeof imageSize>;
	try {
		dimensions = imageSize(buffer);
	} catch {
		return null;
	}
	const extension = dimensions.type
		? ALLOWED_IMAGE_EXTENSIONS[dimensions.type]
		: undefined;
	if (!extension || !dimensions.width || !dimensions.height) {
		return null;
	}
	return { extension, aspectRatio: dimensions.width / dimensions.height };
}
