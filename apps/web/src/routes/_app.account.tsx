import { displayRole } from "@haizu/shared";
import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "#/contexts/snackbar-context";
import { MyProfileCard } from "#/features/members/MyProfileCard";
import type { MemberRow } from "#/features/members/types";
import { authClient } from "#/lib/auth-client";

// Account settings is a per-user screen, so it lives outside the site (/s/$siteId).
// It must be reachable even by users who belong to no site.
type AccountSearch = { site?: string };

export const Route = createFileRoute("/_app/account")({
	validateSearch: (search): AccountSearch => ({
		site: typeof search.site === "string" ? search.site : undefined,
	}),
	component: AccountPage,
});

function AccountPage() {
	const { user } = Route.useRouteContext();
	const { site } = Route.useSearch();
	const router = useRouter();
	const navigate = useNavigate();
	const canGoBack = useCanGoBack();
	const { t } = useTranslation(["account", "common"]);
	const { showSuccess } = useSnackbar();

	// Return to the previous screen. If there's no history, go to the originating site, else to site selection.
	const goBack = () => {
		if (canGoBack) {
			router.history.back();
			return;
		}
		if (site) {
			void navigate({ to: "/s/$siteId/home", params: { siteId: site } });
			return;
		}
		void navigate({ to: "/select-site" });
	};

	const updateNameMutation = useMutation({
		mutationFn: (name: string) => authClient.updateUser({ name }),
		onSuccess: async () => {
			await router.invalidate();
			showSuccess(t("account:nameUpdated"));
		},
	});

	const me: MemberRow = {
		id: user.id,
		kind: "user",
		name: user.name,
		email: user.email,
		orgRole: user.role,
		siteRoles: [],
		allSites: user.role === "admin",
		status: user.isActive ? "active" : "inactive",
	};
	// Since this per-user screen is site-independent, the badge is determined by the org role only
	const badgeRole = displayRole(user.role, null) ?? "viewer";

	return (
		<div className="min-h-screen bg-app-bg">
			<header className="h-15.5 bg-surface border-b border-border flex items-center px-6 gap-4">
				<div className="flex items-center gap-2.75">
					<img
						src="/logo.svg"
						alt="haizu"
						className="w-9.5 h-9.5 rounded-[10px]"
					/>
					<div className="font-bold text-xl leading-none text-ink">haizu</div>
				</div>
			</header>

			<div className="p-7">
				<div className="max-w-170 mx-auto">
					<button
						type="button"
						onClick={goBack}
						className="flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink cursor-pointer border-none bg-transparent p-0 mb-4"
					>
						<span aria-hidden="true">←</span>
						{t("common:back")}
					</button>

					<div className="text-[22px] font-bold">{t("account:title")}</div>
					<div className="text-[13.5px] text-muted mt-1.25 mb-4.5">
						{t("account:subtitle")}
					</div>

					<MyProfileCard
						member={me}
						displayRole={badgeRole}
						isPending={updateNameMutation.isPending}
						onSaveName={(name) => updateNameMutation.mutate(name)}
					/>
				</div>
			</div>
		</div>
	);
}
