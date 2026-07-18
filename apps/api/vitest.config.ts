import { defineConfig } from "vitest/config";

// unit: 純粋関数のテスト。Docker 不要で高速に回す。
// integration: Testcontainers で実 Postgres を立てて app.request() でルートを叩く。
export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "unit",
					include: ["src/**/*.test.ts"],
				},
			},
			{
				test: {
					name: "integration",
					include: ["test/integration/**/*.test.ts"],
					globalSetup: ["./test/global-setup.ts"],
					setupFiles: ["./test/setup.ts"],
					testTimeout: 30_000,
					hookTimeout: 120_000,
				},
			},
		],
	},
});
