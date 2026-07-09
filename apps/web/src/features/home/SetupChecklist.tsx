import { Link } from "@tanstack/react-router";

type Step = {
	label: string;
	description: string;
	to: "/settings/shifts" | "/employees" | "/editor";
	done: boolean;
};

export function SetupChecklist({
	hasShifts,
	hasEmployees,
	hasAreas,
}: {
	hasShifts: boolean;
	hasEmployees: boolean;
	hasAreas: boolean;
}) {
	const steps: Step[] = [
		{
			label: "シフトを登録",
			description: "拠点の勤務体制（交代制とシフト）を設定します。",
			to: "/settings/shifts",
			done: hasShifts,
		},
		{
			label: "従業員を登録",
			description: "配置する従業員を登録します。",
			to: "/employees",
			done: hasEmployees,
		},
		{
			label: "配置エリアを登録",
			description: "フロアマップと配置スポットを作成します。",
			to: "/editor",
			done: hasAreas,
		},
	];

	const nextIndex = steps.findIndex((s) => !s.done);
	const doneCount = steps.filter((s) => s.done).length;

	return (
		<div className="max-w-175">
			<div className="text-[22px] font-bold">初期セットアップ</div>
			<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
				haizu を使い始めるには、次の3ステップを順番に登録してください。（
				{doneCount}/{steps.length} 完了）
			</div>

			<ol className="flex flex-col gap-3">
				{steps.map((step, i) => {
					const active = i === nextIndex;
					return (
						<li key={step.to}>
							<Link
								to={step.to}
								className={`flex items-center gap-4 bg-surface border rounded-lg p-4.5 shadow-card transition-shadow duration-150 hover:shadow-float ${
									active ? "border-primary" : "border-border"
								}`}
							>
								<div
									className={`flex-none flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
										step.done
											? "bg-primary text-white"
											: active
												? "bg-primary-soft text-primary"
												: "bg-empty-bg text-faint"
									}`}
								>
									{step.done ? "✓" : i + 1}
								</div>
								<div className="min-w-0">
									<div className="font-bold text-[15px]">{step.label}</div>
									<div className="text-[13px] text-muted mt-0.5">
										{step.description}
									</div>
								</div>
								<div className="ml-auto flex-none text-[13px] text-faint">
									{step.done ? "登録済み" : active ? "次はこちら →" : "未登録"}
								</div>
							</Link>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
