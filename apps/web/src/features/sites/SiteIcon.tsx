import type { SiteIconColor } from "#/contexts/site-context";

type Size = "md" | "lg";

const OUTER: Record<Size, string> = {
	md: "w-10.5 h-10.5 rounded-[11px]",
	lg: "w-12 h-12 rounded-[13px]",
};

const INNER: Record<Size, string> = {
	md: "w-4.5 h-4.5 rounded-[5px]",
	lg: "w-5 h-5 rounded-[5px]",
};

export function SiteIcon({
	icon,
	size = "md",
}: {
	icon: SiteIconColor;
	size?: Size;
}) {
	return (
		<div
			className={`shrink-0 flex items-center justify-center ${OUTER[size]}`}
			style={{ backgroundColor: icon.bg }}
		>
			<div className={INNER[size]} style={{ backgroundColor: icon.color }} />
		</div>
	);
}
