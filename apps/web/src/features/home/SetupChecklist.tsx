import { Link } from "@tanstack/react-router";

type Step = {
	label: string;
	description: string;
	to:
		| "/s/$siteId/settings/shifts"
		| "/s/$siteId/employees"
		| "/s/$siteId/editor";
	done: boolean;
	// データは存在するが完了条件を満たしていない状態（例: エリアが下書きのみで未公開）
	inProgress?: boolean;
	pendingLabel: string;
};

export function SetupChecklist({
	siteId,
	hasShifts,
	hasEmployees,
	hasAreas,
	hasDraftArea,
}: {
	siteId: string;
	hasShifts: boolean;
	hasEmployees: boolean;
	hasAreas: boolean;
	hasDraftArea: boolean;
}) {
	const steps: Step[] = [
		{
			label: "シフトを登録",
			description: "拠点の勤務体制（交代制とシフト）を設定します。",
			to: "/s/$siteId/settings/shifts",
			done: hasShifts,
			pendingLabel: "未登録",
		},
		{
			label: "従業員を登録",
			description: "配置する従業員を登録します。",
			to: "/s/$siteId/employees",
			done: hasEmployees,
			pendingLabel: "未登録",
		},
		{
			label: "配置エリアを登録",
			description: hasDraftArea
				? "下書きの規格があります。規格を公開すると完了します。"
				: "フロアマップと配置スポットを作成し、規格を公開します。",
			to: "/s/$siteId/editor",
			done: hasAreas,
			inProgress: hasDraftArea,
			pendingLabel: hasDraftArea ? "下書きあり（未公開）" : "未登録",
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
					const inner = (
						<>
							<div
								className={`flex-none flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
									step.done
										? "bg-primary text-white"
										: active
											? "bg-primary text-white"
											: step.inProgress
												? "bg-warning-soft text-warning"
												: "bg-empty-bg text-faint"
								}`}
							>
								{step.done ? "✓" : i + 1}
							</div>
							<div className="min-w-0">
								<div
									className={`font-bold text-[15px] ${active ? "text-primary-hover" : ""}`}
								>
									{step.label}
								</div>
								<div className="text-[13px] text-muted mt-0.5">
									{step.description}
								</div>
							</div>
							<div className="ml-auto flex-none">
								{step.done ? (
									<span className="text-[13px] text-faint">登録済み</span>
								) : active ? (
									<span className="text-[13px] font-bold text-white bg-primary px-3 py-1.5 rounded-pill">
										{step.inProgress ? "続きから →" : "次はこちら →"}
									</span>
								) : (
									<span
										className={`text-[13px] ${step.inProgress ? "font-bold text-warning" : "text-faint"}`}
									>
										{step.pendingLabel}
									</span>
								)}
							</div>
						</>
					);

					return (
						<li key={step.to}>
							{step.done ? (
								<div className="flex items-center gap-4 rounded-lg p-4.5 bg-surface border border-border shadow-card">
									{inner}
								</div>
							) : (
								<Link
									to={step.to}
									params={{ siteId }}
									className={`flex items-center gap-4 rounded-lg p-4.5 transition-shadow duration-150 hover:shadow-float ${
										active
											? "bg-primary-soft border-2 border-primary shadow-float ring-2 ring-primary-soft"
											: "bg-surface border border-border shadow-card"
									}`}
								>
									{inner}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</div>
	);
}
