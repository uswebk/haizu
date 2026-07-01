import { useEffect, useRef, useState } from "react";
import type { SpotState } from "./types";

const DEFAULT_IMAGE_SCALE = 1;

export function useSpotEditor(
	initialSpots: SpotState[] | undefined,
	versionId: string | undefined,
	zoom: number,
	initialImageScale?: number,
) {
	const [spots, setSpots] = useState<SpotState[]>(initialSpots ?? []);
	const [imageScale, setImageScaleState] = useState<number>(
		initialImageScale ?? DEFAULT_IMAGE_SCALE,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: versionId はバージョン切り替え時のリセットトリガーとして意図的に追加
	useEffect(() => {
		if (initialSpots !== undefined) {
			setSpots(initialSpots);
		}
	}, [versionId, initialSpots]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: versionId はバージョン切り替え時のリセットトリガーとして意図的に追加
	useEffect(() => {
		setImageScaleState(initialImageScale ?? DEFAULT_IMAGE_SCALE);
	}, [versionId, initialImageScale]);
	const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

	const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

	const containerRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		spotId: string;
		startClientX: number;
		startClientY: number;
		startSpotX: number;
		startSpotY: number;
	} | null>(null);
	const resizeRef = useRef<{
		spotId: string;
		startClientX: number;
		startClientY: number;
		startSize: number;
	} | null>(null);
	const handleSpotPointerDown = (
		e: React.PointerEvent<HTMLElement>,
		spotId: string,
	) => {
		e.stopPropagation();
		setSelectedSpotId(spotId);
		const spot = spots.find((s) => s.id === spotId);
		if (!spot) return;
		dragRef.current = {
			spotId,
			startClientX: e.clientX,
			startClientY: e.clientY,
			startSpotX: spot.x,
			startSpotY: spot.y,
		};
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handleResizePointerDown = (
		e: React.PointerEvent<HTMLElement>,
		spotId: string,
	) => {
		e.stopPropagation();
		const spot = spots.find((s) => s.id === spotId);
		if (!spot) return;
		resizeRef.current = {
			spotId,
			startClientX: e.clientX,
			startClientY: e.clientY,
			startSize: spot.size,
		};
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handleContainerPointerMove = (
		e: React.PointerEvent<HTMLDivElement>,
	) => {
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();

		if (dragRef.current) {
			const { spotId, startClientX, startClientY, startSpotX, startSpotY } =
				dragRef.current;
			const dx = ((e.clientX - startClientX) / rect.width) * 100;
			const dy = ((e.clientY - startClientY) / rect.height) * 100;
			const newX = Math.max(3, Math.min(97, startSpotX + dx));
			const newY = Math.max(3, Math.min(97, startSpotY + dy));
			setSpots((prev) =>
				prev.map((s) => (s.id === spotId ? { ...s, x: newX, y: newY } : s)),
			);
		}

		if (resizeRef.current) {
			const { spotId, startClientX, startClientY, startSize } =
				resizeRef.current;
			const delta =
				(e.clientX - startClientX + (e.clientY - startClientY)) / 2 / zoom;
			const newSize = Math.max(40, Math.min(120, startSize + delta));
			setSpots((prev) =>
				prev.map((s) => (s.id === spotId ? { ...s, size: newSize } : s)),
			);
		}
	};

	const handleContainerPointerUp = () => {
		dragRef.current = null;
		resizeRef.current = null;
	};

	const addSpot = () => {
		const newSpot: SpotState = {
			id: `s${Date.now()}`,
			label: `${spots.length + 1}`,
			x: 50,
			y: 50,
			size: 56,
		};
		setSpots((prev) => [...prev, newSpot]);
		setSelectedSpotId(newSpot.id);
	};

	const deleteSpot = (spotId: string) => {
		setSpots((prev) => prev.filter((s) => s.id !== spotId));
		setSelectedSpotId(null);
	};

	const updateSpotLabel = (spotId: string, label: string) => {
		setSpots((prev) =>
			prev.map((s) => (s.id === spotId ? { ...s, label } : s)),
		);
	};

	const updateSpotSize = (spotId: string, delta: number) => {
		setSpots((prev) =>
			prev.map((s) =>
				s.id === spotId
					? { ...s, size: Math.max(40, Math.min(120, s.size + delta)) }
					: s,
			),
		);
	};

	const setImageScale = (scale: number) => {
		const clamped = Math.max(0.2, Math.min(5, scale));
		setImageScaleState(clamped);
	};

	const resetImageScale = () => {
		setImageScaleState(DEFAULT_IMAGE_SCALE);
	};

	return {
		spots,
		selectedSpotId,
		selectedSpot,
		setSelectedSpotId,
		containerRef,
		imageScale,
		setImageScale,
		resetImageScale,
		handleSpotPointerDown,
		handleResizePointerDown,
		handleContainerPointerMove,
		handleContainerPointerUp,
		addSpot,
		deleteSpot,
		updateSpotLabel,
		updateSpotSize,
	};
}
