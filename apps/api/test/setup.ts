import { inject } from "vitest";
import postgres from "postgres";

// 各ワーカーで一度だけ実行される。テストファイルの import より先に走るので、
// ここで DATABASE_URL をセットすれば db/client.ts のシングルトンがテスト用 DB に向く。
// 注意: このファイルから src/ 配下(app や db)を import しないこと。
// env をセットする前にモジュールが評価され、開発用 DB に接続してしまう。

const adminUrl = inject("dbAdminUrl");
const poolId = process.env.VITEST_POOL_ID ?? "0";
const dbName = `haizu_test_${poolId}`;

const admin = postgres(adminUrl, { max: 1 });
try {
	await admin.unsafe(
		`CREATE DATABASE ${dbName} TEMPLATE haizu_template`,
	);
} catch (error) {
	// 同じワーカーIDの2回目以降の実行では既に存在する(42P04)ので無視
	if ((error as { code?: string }).code !== "42P04") throw error;
}
await admin.end();

const workerUrl = new URL(adminUrl);
workerUrl.pathname = `/${dbName}`;

process.env.DATABASE_URL = workerUrl.toString();
process.env.BETTER_AUTH_SECRET = "test-secret-for-integration-tests";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.WEB_ORIGIN = "http://localhost:3000";
process.env.APP_ENV = "local";
// メール送信は ConsoleEmailSender(コンソール出力のみ)に落とす
delete process.env.EMAIL_DRIVER;
