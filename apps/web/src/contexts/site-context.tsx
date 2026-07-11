import type { SiteInput } from "@haizu/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "#/contexts/snackbar-context";
import {
	createSite,
	fetchSites,
	type Site,
	siteKeys,
	updateSite as updateSiteApi,
} from "#/lib/api/sites";

export const MAX_SITES = 10;

export type SiteIconColor = { bg: string; color: string };

// Type that adds a display icon (iconBg/iconColor bundled) to the API's Site.
export type SiteView = Site & { icon: SiteIconColor };

function toView(site: Site): SiteView {
	return { ...site, icon: { bg: site.iconBg, color: site.iconColor } };
}

// Placeholder so referencing currentSite doesn't break when there are no sites / while loading.
const PLACEHOLDER: SiteView = {
	id: "",
	organizationId: "",
	name: "—",
	description: "",
	iconBg: "#dcf2f0",
	iconColor: "#0ea5a4",
	isActive: true,
	employeeCount: 0,
	role: "viewer",
	icon: { bg: "#dcf2f0", color: "#0ea5a4" },
};

type SiteContextValue = {
	sites: SiteView[];
	activeSites: SiteView[];
	currentSite: SiteView;
	canAddSite: boolean;
	isLoading: boolean;
	addSite: (input: SiteInput) => void;
	updateSite: (id: string, input: SiteInput) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

// The current site's source of truth is the URL (/s/$siteId), so siteId is passed in by the caller.
// On screens with no site selected (the site selection screen), siteId isn't passed.
export function SiteProvider({
	siteId,
	children,
}: {
	siteId?: string;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	const { t } = useTranslation("sites");
	// SiteProvider is mounted only within authenticated areas.
	const { data: rawSites = [], isLoading } = useQuery({
		queryKey: siteKeys.all,
		queryFn: fetchSites,
	});

	const sites = useMemo(() => rawSites.map(toView), [rawSites]);
	const activeSites = useMemo(() => sites.filter((s) => s.isActive), [sites]);

	const invalidateSites = () =>
		queryClient.invalidateQueries({ queryKey: siteKeys.all });

	const addMutation = useMutation({
		mutationFn: (input: SiteInput) => createSite(input),
		onSuccess: () => {
			void invalidateSites();
			showSuccess(t("siteAdded"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, input }: { id: string; input: SiteInput }) =>
			updateSiteApi(id, input),
		onSuccess: () => {
			void invalidateSites();
			showSuccess(t("siteUpdated"));
		},
	});

	const value = useMemo<SiteContextValue>(() => {
		const currentSite = sites.find((s) => s.id === siteId) ?? PLACEHOLDER;

		return {
			sites,
			activeSites,
			currentSite,
			canAddSite: sites.length < MAX_SITES,
			isLoading,
			addSite: (input: SiteInput) => addMutation.mutate(input),
			updateSite: (id: string, input: SiteInput) =>
				updateMutation.mutate({ id, input }),
		};
	}, [sites, activeSites, siteId, isLoading, addMutation, updateMutation]);

	return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
	const ctx = useContext(SiteContext);
	if (!ctx) throw new Error("useSite must be used within a SiteProvider");
	return ctx;
}
