export const AVATAR_COLORS = [
	"#2f8fd6",
	"#3d9970",
	"#f0883e",
	"#8b5cf6",
	"#26a69a",
	"#e85d75",
	"#d4a017",
	"#ef6c5a",
];

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isValidAvatarColor(value: string): boolean {
	return HEX_COLOR.test(value);
}
