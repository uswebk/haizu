import type { SiteInput } from "@haiz/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getCurrentSiteId, setCurrentSiteId } from "#/lib/api";
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
	icon: { bg: "#dcf2f0", color: "#0ea5a4" },
};

type SiteContextValue = {
	sites: SiteView[];
	activeSites: SiteView[];
	currentSite: SiteView;
	canAddSite: boolean;
	isLoading: boolean;
	switchSite: (id: string) => void;
	addSite: (input: SiteInput) => void;
	updateSite: (id: string, input: SiteInput) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const { data: rawSites = [], isLoading } = useQuery({
		queryKey: siteKeys.all,
		queryFn: fetchSites,
	});

	const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(() =>
		getCurrentSiteId(),
	);

	const sites = useMemo(() => rawSites.map(toView), [rawSites]);
	const activeSites = useMemo(() => sites.filter((s) => s.isActive), [sites]);

	// 初回ロードや、選択中拠点が無効になった場合は先頭のアクティブ拠点を選ぶ。
	useEffect(() => {
		const first = activeSites[0];
		if (!first) return;
		const valid = activeSites.some((s) => s.id === currentSiteId);
		if (!valid) {
			setCurrentSiteId(first.id);
			setCurrentSiteIdState(first.id);
		}
	}, [activeSites, currentSiteId]);

	const invalidateSites = () =>
		queryClient.invalidateQueries({ queryKey: siteKeys.all });

	const addMutation = useMutation({
		mutationFn: (input: SiteInput) => createSite(input),
		onSuccess: () => void invalidateSites(),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, input }: { id: string; input: SiteInput }) =>
			updateSiteApi(id, input),
		onSuccess: () => void invalidateSites(),
	});

	const value = useMemo<SiteContextValue>(() => {
		const currentSite =
			sites.find((s) => s.id === currentSiteId) ??
			activeSites[0] ??
			PLACEHOLDER;

		const switchSite = (id: string) => {
			if (!sites.some((s) => s.id === id && s.isActive)) return;
			setCurrentSiteId(id);
			setCurrentSiteIdState(id);
			// 拠点が変わると x-site-id が変わる。invalidate だと再取得中も前拠点の
			// キャッシュが表示され一瞬前データがちらつくため、拠点スコープの
			// クエリはキャッシュごと破棄して即ローディング状態にする。
			// 拠点一覧(["sites"])は組織スコープで変わらないので除外する。
			queryClient.removeQueries({
				predicate: (query) => query.queryKey[0] !== siteKeys.all[0],
			});
		};

		return {
			sites,
			activeSites,
			currentSite,
			canAddSite: sites.length < MAX_SITES,
			isLoading,
			switchSite,
			addSite: (input: SiteInput) => addMutation.mutate(input),
			updateSite: (id: string, input: SiteInput) =>
				updateMutation.mutate({ id, input }),
		};
	}, [
		sites,
		activeSites,
		currentSiteId,
		isLoading,
		queryClient,
		addMutation,
		updateMutation,
	]);

	return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
	const ctx = useContext(SiteContext);
	if (!ctx) throw new Error("useSite must be used within a SiteProvider");
	return ctx;
}
