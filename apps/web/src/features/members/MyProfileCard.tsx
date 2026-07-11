import type { DisplayRole } from "@haizu/shared";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { RoleBadge } from "#/components/ui/RoleBadge";
import { EmailChange } from "./EmailChange";
import { PasswordChange } from "./PasswordChange";
import { roleBadgeKey } from "./roleBadgeKey";
import type { MemberRow, MemberStatus } from "./types";

const STATUS_TONE: Record<MemberStatus, "success" | "draft" | "warning"> = {
	active: "success",
	inactive: "draft",
	invited: "warning",
};

type Props = {
	member: MemberRow;
	displayRole: DisplayRole;
	isPending: boolean;
	onSaveName: (name: string) => void;
};

export function MyProfileCard({
	member,
	displayRole,
	isPending,
	onSaveName,
}: Props) {
	const { t } = useTranslation(["members", "common"]);
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(member.name);

	const startEdit = () => {
		setName(member.name);
		setEditing(true);
	};

	const save = () => {
		const trimmed = name.trim();
		if (trimmed.length === 0 || trimmed === member.name) {
			setEditing(false);
			return;
		}
		onSaveName(trimmed);
		setEditing(false);
	};

	return (
		<div className="mb-5 p-5 border border-border rounded-section bg-surface">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div className="min-w-0">
					<div className="text-xs font-semibold text-faint mb-1.5">
						{t("members:myInfo")}
					</div>
					{editing ? (
						<div className="flex items-center gap-2">
							<Input
								value={name}
								autoFocus
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") save();
									if (e.key === "Escape") setEditing(false);
								}}
								className="w-55"
							/>
							<Button size="sm" onClick={save} disabled={isPending}>
								{t("common:save")}
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setEditing(false)}
								disabled={isPending}
							>
								{t("common:cancel")}
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-2.5">
							<span className="font-semibold text-lg">{member.name}</span>
							<button
								type="button"
								onClick={startEdit}
								className="text-[12px] font-semibold text-primary cursor-pointer border-none bg-transparent"
							>
								{t("common:edit")}
							</button>
						</div>
					)}
					<div className="text-xs text-faint mt-1">{member.email}</div>
				</div>
				<div className="flex items-center gap-2.5 shrink-0">
					<RoleBadge role={roleBadgeKey(displayRole)} />
					<Badge tone={STATUS_TONE[member.status]}>
						{t(`members:status.${member.status}`)}
					</Badge>
				</div>
			</div>

			<div className="mt-4 pt-4 border-t border-hairline flex flex-col gap-4">
				<EmailChange currentEmail={member.email} />
				<PasswordChange />
			</div>
		</div>
	);
}
