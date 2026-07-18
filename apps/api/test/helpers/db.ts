import { sql } from "drizzle-orm";
import { db } from "../../src/db/client";

// テストごとの分離: 全テーブルを空にする(drizzle のマイグレーション管理テーブルは除く)。
// TEMPLATE 複製よりはるかに速く、シーケンス・FK も CASCADE でまとめてリセットできる。
export async function resetDb() {
	const rows = await db.execute<{ tablename: string }>(
		sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
	);
	const tables = rows
		.map((r) => `"${r.tablename}"`)
		.join(", ");
	if (tables.length === 0) return;
	await db.execute(
		sql.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`),
	);
}
