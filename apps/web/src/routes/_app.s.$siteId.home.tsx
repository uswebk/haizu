import { canSite } from "@haizu/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
	// 下書きのみでは配置に使えないため、公開済みの規格を持つエリアがあって初めて完了扱いにする
	const hasAreas = areas.some((a) => a.currentStatus === "published");
	// エリアは存在するが未公開（下書きのみ）の状態
	const hasDraftArea = !hasAreas && areas.length > 0;
	const setupComplete = hasShifts && hasEmployees && hasAreas;
	// 初期セットアップはシフト・従業員・配置エリアの作成を促すもの。書き込み権限が無ければ出さない。
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
