import { canSite } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HomeSummary } from "#/features/home/HomeSummary";
import { SetupChecklist } from "#/features/home/SetupChecklist";
import { areaKeys, fetchAreas } from "#/lib/api/areas";
import { employeeKeys, fetchEmployees } from "#/lib/api/employees";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";
import { todayStr } from "#/lib/datetime";
import { assertScreen } from "#/lib/guards";

export const Route = createFileRoute("/_app/s/$siteId/home")({
	beforeLoad: ({ context, params }) => {
		assertScreen(context.user.role, context.siteRole, params.siteId, "home");
	},
	component: Home,
});

function Home() {
	const { siteRole } = Route.useRouteContext();
	const { siteId } = Route.useParams();
	const { t } = useTranslation("common");
	const today = todayStr();

	const workPatternQuery = useQuery({
		queryKey: workPatternKeys.detail,
		queryFn: fetchWorkPattern,
	});
	const employeesQuery = useQuery({
		queryKey: employeeKeys.all,
		queryFn: fetchEmployees,
	});
	const areasQuery = useQuery({
		queryKey: areaKeys.all,
		queryFn: () => fetchAreas(today),
	});

	if (
		workPatternQuery.isPending ||
		employeesQuery.isPending ||
		areasQuery.isPending
	) {
		return <div className="p-7 text-muted text-sm">{t("loading")}</div>;
	}

	const workPattern = workPatternQuery.data;
	const employees = employeesQuery.data ?? [];
	const areas = areasQuery.data ?? [];

	const hasShifts = !!workPattern;
	const hasEmployees = employees.length > 0;
	// A draft-only area can't be assigned, so it counts as done only once an area has a published spec
	const hasAreas = areas.some((a) => a.currentStatus === "published");
	// State where an area exists but is unpublished (draft only)
	const hasDraftArea = !hasAreas && areas.length > 0;
	const setupComplete = hasShifts && hasEmployees && hasAreas;
	// Initial setup prompts creating shifts, employees, and layout areas. Not shown without write permission.
	const canSetup = canSite(siteRole, "area:write");

	return (
		<div className="p-7 overflow-auto h-full">
			{canSetup && !setupComplete ? (
				<SetupChecklist
					siteId={siteId}
					hasShifts={hasShifts}
					hasEmployees={hasEmployees}
					hasAreas={hasAreas}
					hasDraftArea={hasDraftArea}
				/>
			) : (
				workPattern && (
					<HomeSummary
						siteId={siteId}
						today={today}
						areas={areas}
						activeEmployeeCount={employees.filter((e) => e.isActive).length}
						workPattern={workPattern}
					/>
				)
			)}
		</div>
	);
}
