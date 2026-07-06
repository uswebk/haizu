// 環境識別子。Vite はビルド時に import.meta.env へ焼き込む（VITE_ 接頭辞が必須）。
// 未設定・local 以外はすべて非local扱い（開発用機能を無効化）。
export const isLocal = import.meta.env.VITE_APP_ENV === "local";
