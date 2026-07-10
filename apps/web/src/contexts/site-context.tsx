import type { SiteInput } from "@haizu/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo } from "react";
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

// API の Site に表示用の icon（iconBg/iconColor をまとめたもの）を付与した型。
export type SiteView = Site & { icon: SiteIconColor };

function toView(site: Site): SiteView {
	return { ...site, icon: { bg: site.iconBg, color: site.iconColor } };
}

// 拠点が1件も無い/ロード中に currentSite を参照しても壊れないためのプレースホルダ。
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

// 現在の拠点はURL(/s/$siteId)が真実なので、siteId は呼び出し側から受け取る。
// 拠点未選択の画面（拠点選択画面）では siteId を渡さない。
export function SiteProvider({
	siteId,
	children,
}: {
	siteId?: string;
	children: ReactNode;
}) {
	const queryClient = useQueryClient();
	const { showSuccess } = useSnackbar();
	// SiteProvider は認証済みエリアでのみマウントされる。
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
			showSuccess("拠点を追加しました");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, input }: { id: string; input: SiteInput }) =>
			updateSiteApi(id, input),
		onSuccess: () => {
			void invalidateSites();
			showSuccess("拠点を更新しました");
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
