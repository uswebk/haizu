// 拠点スコープ middleware が解決した現在の拠点・組織を各ハンドラへ渡すための型。
export type AppEnv = {
	Variables: {
		siteId: string;
		organizationId: string;
	};
};
