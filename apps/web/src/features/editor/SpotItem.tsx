import type { SpotState } from "./types";

type Props = {
	spot: SpotState;
	isSelected: boolean;
	zoom: number;
	onPointerDown: (e: React.PointerEvent<HTMLDivElement>, spotId: string) => void;
	onResizePointerDown: (
		e: React.PointerEvent<HTMLDivElement>,
		spotId: string,
	) => void;
};

export function SpotItem({
	spot,
	isSelected,
	zoom,
	onPointerDown,
	onResizePointerDown,
}: Props) {
	const displaySize = spot.size * zoom;

	return (
		<div
			style={{
				position: "absolute",
				left: `${spot.x}%`,
				top: `${spot.y}%`,
				width: `${displaySize}px`,
				height: `${displaySize}px`,
				transform: "translate(-50%, -50%)",
				borderRadius: "50%",
				background: isSelected ? "#0ea5a4" : "#dcf2f0",
				border: isSelected ? "2px solid #0c8e8d" : "1.5px solid #b6e3df",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: `${Math.round(displaySize * 0.23)}px`,
				fontWeight: 700,
				color: isSelected ? "#fff" : "#0c8e8d",
				cursor: "grab",
				userSelect: "none",
				boxShadow: isSelected ? "0 0 0 3px rgba(14,165,164,.2)" : "none",
				touchAction: "none",
				transition: "box-shadow 0.1s",
			}}
			onPointerDown={(e) => onPointerDown(e, spot.id)}
			onClick={(e) => e.stopPropagation()}
		>
			{spot.label}
			{isSelected && (
				<div
					style={{
						position: "absolute",
						right: -5,
						bottom: -5,
						width: 14,
						height: 14,
						borderRadius: "50%",
						background: "#0ea5a4",
						border: "2px solid #fff",
						cursor: "se-resize",
						touchAction: "none",
					}}
					onPointerDown={(e) => onResizePointerDown(e, spot.id)}
				/>
			)}
		</div>
	);
}
