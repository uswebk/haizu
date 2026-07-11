import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/Button";
import { Input } from "#/components/ui/Input";
import { signUp } from "#/lib/api/auth";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const { t } = useTranslation(["auth", "common"]);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const canSubmit =
		name && companyName && email && password.length >= 8 && !submitting;

	const submit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			await signUp({ name, companyName, email, password });
			void navigate({ to: "/verify-otp" });
		} catch (e) {
			setError(e instanceof Error ? e.message : t("signup.failed"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f0f5fb] to-app-bg flex flex-col items-center justify-center p-10">
			<div className="flex items-center gap-2.75 pb-6">
				<img
					src="/logo.svg"
					alt="haizu"
					className="w-11.5 h-11.5 rounded-[12px]"
				/>
				<div>
					<div className="font-bold text-2xl leading-none text-ink">haizu</div>
					<div className="font-mono text-[9.5px] tracking-[.14em] text-faint mt-1">
						{t("common:appTagline")}
					</div>
				</div>
			</div>

			<div className="w-90 max-w-full bg-surface border border-border rounded-section p-6.5">
				<div className="text-lg font-bold">{t("signup.title")}</div>
				<div className="text-[13px] text-muted mt-1">
					{t("signup.subtitle")}
				</div>

				<form
					className="flex flex-col gap-3.5 mt-5"
					onSubmit={(e) => {
						e.preventDefault();
						void submit();
					}}
				>
					<Input
						label={t("signup.name")}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("signup.namePlaceholder")}
						autoComplete="name"
					/>
					<Input
						label={t("signup.companyName")}
						value={companyName}
						onChange={(e) => setCompanyName(e.target.value)}
						placeholder={t("signup.companyPlaceholder")}
						autoComplete="organization"
					/>
					<Input
						label={t("common:email")}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						autoComplete="email"
					/>
					<Input
						label={t("signup.passwordLabel")}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						autoComplete="new-password"
					/>
					{error && <div className="text-[12.5px] text-danger">{error}</div>}
					<Button type="submit" className="w-full mt-1" disabled={!canSubmit}>
						{submitting ? t("signup.submitting") : t("signup.submit")}
					</Button>
				</form>

				<div className="text-[12.5px] text-muted mt-4 text-center">
					{t("signup.haveAccount")}{" "}
					<Link to="/login" className="text-primary font-semibold">
						{t("login.submit")}
					</Link>
				</div>
			</div>
		</div>
	);
}
