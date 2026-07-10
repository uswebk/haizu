import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "#/features/editor/EditorPage";

export const Route = createFileRoute("/_app/editor/$areaId")({
	component: function EditorDetail() {
		const { areaId } = Route.useParams();
		return <EditorPage areaId={areaId} />;
	},
});
