import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HomeSummary } from "#/features/home/HomeSummary";
import { SetupChecklist } from "#/features/home/SetupChecklist";
import { areaKeys, fetchAreas } from "#/lib/api/areas";
import { employeeKeys, fetchEmployees } from "#/lib/api/employees";
import { fetchWorkPattern, workPatternKeys } from "#/lib/api/workPatterns";
import { todayStr } from "#/lib/datetime";

export const Route = createFileRoute("/_app/home")({
	component: Home,
});

function Home() {
	const { user } = Route.useRouteContext();
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
		return <div className="p-7 text-muted text-sm">読み込み中...</div>;
	}

	const workPattern = workPatternQuery.data;
	const employees = employeesQuery.data ?? [];
	const areas = areasQuery.data ?? [];

	const hasShifts = !!workPattern;
	const hasEmployees = employees.length > 0;
	const hasAreas = areas.length > 0;
	const setupComplete = hasShifts && hasEmployees && hasAreas;
	const canSetup = user.role === "admin" || user.role === "site_admin";

	return (
		<div className="p-7 overflow-auto h-full">
			{canSetup && !setupComplete ? (
				<SetupChecklist
					hasShifts={hasShifts}
					hasEmployees={hasEmployees}
					hasAreas={hasAreas}
				/>
			) : (
				workPattern && (
					<HomeSummary
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
