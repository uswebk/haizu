import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import {
	acceptInvitation,
	fetchInvitationPreview,
} from "#/lib/api/invitations";

type InviteAcceptSearch = { token?: string };

export const Route = createFileRoute("/invite-accept")({
	validateSearch: (search): InviteAcceptSearch => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	component: InviteAcceptPage,
});

function Shell({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation("common");
	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f0f5fb] to-app-bg flex flex-col items-center justify-center p-10">
			<div className="flex items-center gap-2.75 pb-6">
				<img
					src="/logo.svg"
					alt="haizu"
					className="w-11.5 h-11.5 rounded-[12px]"
				/>
				<div>
					<div className="font-bold text-2xl leading-none text-ink">haizu</div>
					<div className="font-mono text-[9.5px] tracking-[.14em] text-faint mt-1">
						{t("appTagline")}
					</div>
				</div>
			</div>

			<div className="w-90 max-w-full bg-surface border border-border rounded-section p-6.5">
				{children}
			</div>
		</div>
	);
}

function InviteAcceptPage() {
	const { t } = useTranslation(["auth", "common"]);
	const { token } = Route.useSearch();

	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [accepted, setAccepted] = useState(false);

	const {
		data: invitation,
		isLoading,
		error: previewError,
	} = useQuery({
		queryKey: ["invitation-preview", token],
		queryFn: () => fetchInvitationPreview(token as string),
		enabled: !!token,
		retry: false,
	});

	if (!token) {
		return (
			<Shell>
				<div className="text-lg font-bold">{t("invite.title")}</div>
				<div className="text-[13px] text-danger mt-2">
					{t("invite.invalidUrl")}
				</div>
			</Shell>
		);
	}

	if (isLoading) {
		return (
			<Shell>
				<div className="text-[13px] text-muted">{t("invite.loading")}</div>
			</Shell>
		);
	}

	if (previewError || !invitation) {
		return (
			<Shell>
				<div className="text-lg font-bold">{t("invite.title")}</div>
				<div className="text-[13px] text-danger mt-2">
					{previewError instanceof Error
						? previewError.message
						: t("invite.notFound")}
				</div>
				<div className="text-[12.5px] text-muted mt-4 text-center">
					<Link to="/login" className="text-primary font-semibold">
						{t("invite.toLogin")}
					</Link>
				</div>
			</Shell>
		);
	}

	if (accepted) {
		return (
			<Shell>
				<div className="text-lg font-bold">{t("invite.doneTitle")}</div>
				<div className="text-[13px] text-muted mt-1">
					{t("invite.doneDesc")}
				</div>
				<Link to="/login" className="block mt-5">
					<Button className="w-full">{t("invite.toLogin")}</Button>
				</Link>
			</Shell>
		);
	}

	const canSubmit = password.length >= 8 && !submitting;

	const submit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			await acceptInvitation(token, password);
			setAccepted(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : t("invite.acceptFailed"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Shell>
			<div className="text-lg font-bold">{t("invite.setPasswordTitle")}</div>
			<div className="text-[13px] text-muted mt-1">
				{t("invite.setPasswordDesc", {
					name: `${invitation.lastName} ${invitation.firstName}`,
					email: invitation.email,
					role: t(
						invitation.orgRole === "admin"
							? "invite.orgRoleAdmin"
							: "invite.orgRoleMember",
					),
				})}
			</div>

			<form
				className="flex flex-col gap-3.5 mt-5"
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				<Input
					label={t("signup.passwordLabel")}
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					autoComplete="new-password"
					autoFocus
				/>
				{error && <div className="text-[12.5px] text-danger">{error}</div>}
				<Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
					{submitting ? t("invite.setting") : t("invite.setPassword")}
				</Button>
			</form>
		</Shell>
	);
}
