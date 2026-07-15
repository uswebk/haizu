import { describe, expect, it } from "vitest";
import { parseFloorPlanImage } from "./floor-plan-image";

// 1x1 red pixel PNG
const PNG_1X1 = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

// 2x1 white pixel JPEG
const JPEG_2X1 = Buffer.from(
	"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAIBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z",
	"base64",
);

describe("parseFloorPlanImage", () => {
	it("accepts PNG and returns .png with the aspect ratio", () => {
		const result = parseFloorPlanImage(PNG_1X1);
		expect(result).toEqual({ extension: ".png", aspectRatio: 1 });
	});

	it("accepts JPEG and returns .jpg with the aspect ratio", () => {
		const result = parseFloorPlanImage(JPEG_2X1);
		expect(result).toEqual({ extension: ".jpg", aspectRatio: 2 });
	});

	it("rejects SVG even though image-size can parse it (scriptable format)", () => {
		const svg = Buffer.from(
			'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
		);
		expect(parseFloorPlanImage(svg)).toBeNull();
	});

	it("rejects HTML disguised as an image", () => {
		const html = Buffer.from("<!doctype html><script>alert(1)</script>");
		expect(parseFloorPlanImage(html)).toBeNull();
	});

	it("rejects a detectable format outside the whitelist (GIF)", () => {
		// GIF89a header for a 1x1 image; enough for image-size to detect the type
		const gif = Buffer.from("47494638396101000100800000000000ffffff21f9", "hex");
		expect(parseFloorPlanImage(gif)).toBeNull();
	});

	it("rejects an empty buffer", () => {
		expect(parseFloorPlanImage(Buffer.alloc(0))).toBeNull();
	});
});
