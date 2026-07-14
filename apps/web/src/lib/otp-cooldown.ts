import { OTP_RESEND_COOLDOWN_SECONDS } from "@haizu/shared";

const STORAGE_KEY = "haizu:otp-resend-available-at";

// The countdown is stored as a deadline rather than a remaining-seconds counter so it survives
// reloads and stays honest while the tab is backgrounded (timers are throttled there).
// This is UX only: the real limit is the API rate limiter, which a reload cannot reset.

export const startOtpCooldown = (seconds = OTP_RESEND_COOLDOWN_SECONDS) => {
	if (typeof window === "undefined") return;
	const availableAt = Date.now() + seconds * 1000;
	window.sessionStorage.setItem(STORAGE_KEY, String(availableAt));
};

export const clearOtpCooldown = () => {
	if (typeof window === "undefined") return;
	window.sessionStorage.removeItem(STORAGE_KEY);
};

export const getOtpCooldownSeconds = () => {
	if (typeof window === "undefined") return 0;
	const availableAt = Number(window.sessionStorage.getItem(STORAGE_KEY));
	if (!availableAt) return 0;
	return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
};
