import { type RefObject, useEffect } from "react";

export function useDismiss(
	active: boolean,
	onDismiss: () => void,
	ref: RefObject<HTMLElement | null>,
) {
	useEffect(() => {
		if (!active) return;
		const handlePointerDown = (e: PointerEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onDismiss();
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onDismiss();
		};
		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [active, onDismiss, ref]);
}
