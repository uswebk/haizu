import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { useSnackbar } from "#/contexts/snackbar-context";
import {
	fetchOrganization,
	organizationKeys,
	updateOrganizationName,
} from "#/lib/api/organizations";

export function OrganizationNameForm() {
	const queryClient = useQueryClient();
	const { t } = useTranslation(["orgSettings", "members", "common"]);
	const { showSuccess } = useSnackbar();
	const { data: organization, isPending } = useQuery({
		queryKey: organizationKeys.detail,
		queryFn: fetchOrganization,
	});

	const [name, setName] = useState("");
	useEffect(() => {
		if (organization) setName(organization.name);
	}, [organization]);

	const mutation = useMutation({
		mutationFn: () => updateOrganizationName(name.trim()),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: organizationKeys.detail });
			showSuccess(t("orgSettings:nameUpdated"));
		},
	});

	const dirty = !!organization && name.trim() !== organization.name;
	const canSave = dirty && name.trim().length > 0 && !mutation.isPending;

	return (
		<section className="bg-surface border border-border rounded-lg p-5.5 shadow-card">
			<div className="font-bold text-[15px] mb-3.5">
				{t("orgSettings:orgName")}
			</div>
			<Input
				label={t("orgSettings:orgName")}
				value={name}
				onChange={(e) => setName(e.target.value)}
				width={360}
				disabled={isPending}
			/>
			<div className="flex items-center gap-3.5 mt-4">
				<Button onClick={() => mutation.mutate()} disabled={!canSave}>
					{mutation.isPending
						? t("members:form.saving")
						: t("members:form.save")}
				</Button>
				{mutation.isError && (
					<span className="text-xs font-semibold text-danger">
						{mutation.error.message}
					</span>
				)}
			</div>
		</section>
	);
}
