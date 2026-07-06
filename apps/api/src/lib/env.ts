// 環境依存の設定を1箇所に集約する。値は実行環境から注入される（12-factor）。
// APP_ENV: local / dev / stg / prod。未設定は安全側の "prod" 扱い（dev機能を無効化）。
export const APP_ENV = process.env.APP_ENV ?? "prod";

export const isLocal = APP_ENV === "local";

// フロントのオリジン。CORS と Better Auth の trustedOrigins で共用する（環境ごとに変わる）。
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
