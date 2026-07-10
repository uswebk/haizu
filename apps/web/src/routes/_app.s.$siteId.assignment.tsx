import { createFileRoute, Outlet } from "@tanstack/react-router";
import { assertScreen } from "#/lib/guards";

export type AssignmentSearch = {
	date?: string;
	shiftId?: string;
};

export const Route = createFileRoute("/_app/assignment")({
	validateSearch: (search): AssignmentSearch => ({
		date: typeof search.date === "string" ? search.date : undefined,
		shiftId: typeof search.shiftId === "string" ? search.shiftId : undefined,
	}),
	beforeLoad: ({ context }) => {
		assertScreen(context.user.role, context.siteRole, "assignment");
	},
	component: () => <Outlet />,
});
