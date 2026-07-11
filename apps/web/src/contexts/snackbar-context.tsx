import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";

export type SnackbarVariant = "success" | "info" | "warning" | "error";

export type SnackbarAction = { label: string; onClick: () => void };

type Snack = {
	id: number;
	message: string;
	variant: SnackbarVariant;
	action?: SnackbarAction;
};

type ShowOptions = { variant?: SnackbarVariant; action?: SnackbarAction };

type SnackbarContextValue = {
	show: (message: string, options?: ShowOptions) => void;
	showSuccess: (message: string, action?: SnackbarAction) => void;
	showError: (message: string, action?: SnackbarAction) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

// 表示時間（ミリ秒）
const AUTO_DISMISS_MS = 4000;

const VARIANT_DOT: Record<SnackbarVariant, string> = {
	success: "var(--color-success)",
	info: "var(--color-faint)",
	warning: "var(--color-warning)",
	error: "var(--color-danger)",
};

// 成功・情報は本文と同じ色にして、注意を引く必要があるものだけ色を持たせる
const VARIANT_ACTION: Record<SnackbarVariant, string> = {
	success: "var(--color-ink)",
	info: "var(--color-ink)",
	warning: "var(--color-warning)",
	error: "var(--color-danger)",
};

export function SnackbarProvider({ children }: { children: ReactNode }) {
	const { t } = useTranslation("common");
	const [snacks, setSnacks] = useState<Snack[]>([]);
	const nextId = useRef(0);

	const dismiss = useCallback((id: number) => {
		setSnacks((prev) => prev.filter((s) => s.id !== id));
	}, []);

	const show = useCallback(
		(message: string, options?: ShowOptions) => {
			const id = nextId.current++;
			const variant = options?.variant ?? "success";
			setSnacks((prev) => [
				...prev,
				{ id, message, variant, action: options?.action },
			]);
			setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
		},
		[dismiss],
	);

	const value = useMemo<SnackbarContextValue>(
		() => ({
			show,
			showSuccess: (m: string, action?: SnackbarAction) =>
				show(m, { variant: "success", action }),
			showError: (m: string, action?: SnackbarAction) =>
				show(m, { variant: "error", action }),
		}),
		[show],
	);

	return (
		<SnackbarContext.Provider value={value}>
			{children}
			<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2.5">
				{snacks.map((s) => (
					<div
						key={s.id}
						className="flex items-center gap-3 bg-surface rounded-2xl shadow-float pl-4 pr-2.5 py-3 animate-snackbar-in"
					>
						<span
							className="flex-none w-2 h-2 rounded-full"
							style={{ backgroundColor: VARIANT_DOT[s.variant] }}
						/>
						<span className="text-[13.5px] font-medium text-ink">
							{s.message}
						</span>
						{s.action && (
							<button
								type="button"
								onClick={() => {
									s.action?.onClick();
									dismiss(s.id);
								}}
								className="flex-none text-[13.5px] font-bold cursor-pointer hover:underline"
								style={{ color: VARIANT_ACTION[s.variant] }}
							>
								{s.action.label}
							</button>
						)}
						<button
							type="button"
							onClick={() => dismiss(s.id)}
							aria-label={t("close")}
							className="flex-none w-6 h-6 flex items-center justify-center rounded-sm text-faint hover:text-muted hover:bg-hairline cursor-pointer"
						>
							×
						</button>
					</div>
				))}
			</div>
		</SnackbarContext.Provider>
	);
}

export function useSnackbar() {
	const ctx = useContext(SnackbarContext);
	if (!ctx) {
		throw new Error("useSnackbar must be used within a SnackbarProvider");
	}
	return ctx;
}
