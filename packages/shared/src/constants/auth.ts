// Minimum password length. Shared by frontend validation and the backend Better Auth config
export const MIN_PASSWORD_LENGTH = 8;

// Minimum interval between OTP resends. Enforced by the backend rate limiter; the frontend
// uses the same value to show a countdown instead of letting the user hit a 429.
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
