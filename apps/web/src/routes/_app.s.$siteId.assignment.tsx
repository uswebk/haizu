import { createFileRoute, Outlet } from "@tanstack/react-router";
import { assertScreen } from "#/lib/guards";

export type AssignmentSearch = {
	date?: string;
	shiftId?: string;
};

export const Route = createFileRoute("/_app/s/$siteId/assignment")({
	validateSearch: (search): AssignmentSearch => ({
		date: typeof search.date === "string" ? search.date : undefined,
		shiftId: typeof search.shiftId === "string" ? search.shiftId : undefined,
	}),
	beforeLoad: ({ context, params }) => {
		assertScreen(
			context.user.role,
			context.siteRole,
			params.siteId,
			"assignment",
		);
	},
	component: () => <Outlet />,
});
