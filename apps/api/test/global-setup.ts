import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { TestProject } from "vitest/node";

// Postgres コンテナを1つだけ起動し、マイグレーション適用済みの template DB を作る。
// 各ワーカーは setup.ts でこの template から自分専用の DB を複製する(provide 経由で接続情報を渡す)。
export default async function globalSetup(project: TestProject) {
	// docker-compose.yml と同じイメージに固定して本番相当の挙動を保つ
	const container = await new PostgreSqlContainer("postgres:16-alpine").start();

	const adminUrl = container.getConnectionUri();
	const admin = postgres(adminUrl, { max: 1 });
	await admin.unsafe(`CREATE DATABASE haizu_template`);

	const templateUrl = buildUrl(adminUrl, "haizu_template");
	const templateClient = postgres(templateUrl, { max: 1 });
	await migrate(drizzle(templateClient), {
		migrationsFolder: "./src/db/migrations",
	});
	await templateClient.end();
	await admin.end();

	project.provide("dbAdminUrl", adminUrl);

	return async () => {
		await container.stop();
	};
}

function buildUrl(adminUrl: string, dbName: string) {
	const url = new URL(adminUrl);
	url.pathname = `/${dbName}`;
	return url.toString();
}

declare module "vitest" {
	export interface ProvidedContext {
		dbAdminUrl: string;
	}
}
