// Environment identifier. Vite bakes it into import.meta.env at build time (VITE_ prefix required).
// Anything unset or other than local is treated as non-local (disables dev-only features).
export const isLocal = import.meta.env.VITE_APP_ENV === "local";
