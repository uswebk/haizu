import { createFileRoute } from "@tanstack/react-router";
import { AssignmentDetailPage } from "#/features/assignment/AssignmentDetailPage";
import { todayStr } from "#/lib/datetime";

export const Route = createFileRoute("/_app/s/$siteId/assignment/$areaId")({
	component: AssignmentDetail,
});

function AssignmentDetail() {
	const { siteId, areaId } = Route.useParams();
	const search = Route.useSearch();
	return (
		<AssignmentDetailPage
			siteId={siteId}
			areaId={areaId}
			date={search.date ?? todayStr()}
			searchShiftId={search.shiftId}
		/>
	);
}
