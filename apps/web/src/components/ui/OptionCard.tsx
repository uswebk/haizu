type OptionCardProps = {
	title: string;
	description: string;
	selected: boolean;
	onClick: () => void;
};

export function OptionCard({
	title,
	description,
	selected,
	onClick,
}: OptionCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`text-left rounded-lg border p-4.5 cursor-pointer transition-colors duration-150 ${
				selected
					? "border-primary bg-primary-soft/40"
					: "border-border bg-surface hover:bg-app-bg"
			}`}
		>
			<div className="text-sm font-bold">{title}</div>
			<div className="text-xs text-muted mt-1.25 leading-relaxed">
				{description}
			</div>
		</button>
	);
}
