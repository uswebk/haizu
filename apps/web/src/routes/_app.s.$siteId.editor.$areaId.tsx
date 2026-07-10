import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "#/features/editor/EditorPage";

export const Route = createFileRoute("/_app/s/$siteId/editor/$areaId")({
	component: function EditorDetail() {
		const { siteId, areaId } = Route.useParams();
		return <EditorPage siteId={siteId} areaId={areaId} />;
	},
});
