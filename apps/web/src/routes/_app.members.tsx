import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/members")({
	component: () => (
		<div className="p-7 text-muted text-[14px]">準備中...</div>
	),
});
