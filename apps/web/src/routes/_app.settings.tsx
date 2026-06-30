import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
	component: () => <div className="p-7 text-muted text-sm">準備中...</div>,
});
