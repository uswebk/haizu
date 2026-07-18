# APIテスト戦略（apps/api）

## 方針（テストピラミッド）

1. **ユニットテスト（最優先・最多）** — DB や HTTP に依存しない純粋関数のテスト。ビジネスロジックはできる限り `src/features/**` に純粋関数として切り出し、ここでカバーする（例: `features/areas/version.ts`、`features/work-patterns/diff.ts`、`middleware/session-access.ts`）。
2. **統合テスト** — Testcontainers で実 Postgres を起動し、Hono の `app.request()` でミドルウェア（認証・siteScope・権限）込みのルートを叩く。認可、SQL、トランザクション、DB 制約に関わる挙動はここでカバーする。
3. **実サーバー E2E はやらない** — `app.request()` はサーバー起動なしにルーティング〜レスポンスまで実機同等に通るため、HTTP サーバーを立てる E2E は追加のカバレッジがほぼなくコストだけ増える。

## 何をどこでテストするか

| 対象 | 種別 | 例 |
|------|------|-----|
| 日付・差分・ポリシー等のロジック | ユニット | `src/features/**/*.test.ts` |
| 認可（siteScope・ロール別 403/404） | 統合 | `test/integration/tenant-isolation.test.ts` |
| トランザクション・upsert・一意制約 | 統合 | `test/integration/assignments-save.test.ts` |
| 複数テーブルにまたがる解決ロジックの結線 | 統合 | `test/integration/areas-versions.test.ts` |

## 実行方法

```bash
cd apps/api
pnpm test:unit         # 純粋関数のみ。Docker 不要・高速
pnpm test:integration  # Testcontainers。Docker 起動が必要
pnpm test              # 両方
```

統合テストは初回のみ Postgres イメージ（`postgres:16-alpine`）の pull で時間がかかる。2回目以降は数十秒で終わる。

## 統合テスト基盤の仕組み

- `test/global-setup.ts` — Postgres コンテナを **1つだけ** 起動し、全マイグレーション適用済みの `haizu_template` DB を作成。接続情報を `provide()` でワーカーへ渡す。
- `test/setup.ts` — 各ワーカーで `CREATE DATABASE haizu_test_<workerId> TEMPLATE haizu_template` を実行し、`process.env.DATABASE_URL` をそのワーカー専用 DB に向ける。テストファイルの並列実行（ファイル単位）はこれで衝突しない。
- 各テストの `beforeEach` で `resetDb()`（`test/helpers/db.ts`）を呼び、全テーブルを TRUNCATE してテスト間を分離する。

### ⚠️ 重要な制約

- `src/db/client.ts` はモジュール読み込み時に `DATABASE_URL` へ接続するシングルトン。**`test/setup.ts` から `src/` 配下のモジュールを import してはいけない**（env セット前に開発用 DB へ接続してしまう）。テストファイル内での import は setupFiles 実行後なので安全。
- サーバー起動を伴う `src/index.ts` は import しない。アプリ本体は `src/app.ts` を import する。

## ヘルパー

```ts
import { signUpOrg, createMemberUser, authedRequest } from "../helpers/auth";
import { resetDb } from "../helpers/db";
import { createSite, createArea, ... } from "../helpers/factory";

beforeEach(async () => {
  await resetDb();
});

// 組織 + admin ユーザーを作成し、本物のセッション Cookie を得る
const admin = await signUpOrg("テスト株式会社");
// 既存組織に member を追加(role: "admin" | "member")
const member = await createMemberUser(admin.organizationId, "member");

// テストデータは DB 直 insert のファクトリで用意し、検証対象の API だけ HTTP で叩く
const site = await createSite(admin.organizationId);

// cookie + x-site-id 付きでルートを叩く
const res = await authedRequest("/employees", {
  cookie: admin.cookie,
  siteId: site.id,
  method: "POST",
  body: { ... },
});
```

- `requireAuth` は `emailVerified` を要求するため、ヘルパー内で OTP フローの代わりに user テーブルを直接更新して検証済みにしている。
- サイトロールの付与は `createMemberSite(userId, siteId, role)`（org admin は membership 不要で全サイト site_admin 扱い）。

## 新規コードのガイドライン

- **新しいエンドポイントには最低2本**: ① 正常系 1 本、② 権限テスト 1 本（書き込みなら general/viewer ロールで 403、読み取りなら未招待 member で 403）。
- 条件分岐の多いロジックはルートハンドラに書かず `src/features/**` の純粋関数に切り出してユニットテストする。統合テストは「結線されているか」の確認に留め、分岐の網羅はユニット側で行う。
- DB の一意制約・CASCADE・トランザクションに依存する挙動は統合テストで実データを使って確認する（モックしない）。
- スキーマ変更でマイグレーションを追加したら、統合テストは自動で新マイグレーションを適用するので追加作業は不要。

## CI

GitHub Actions の `ubuntu-latest` は Docker が標準で使えるため、Testcontainers は追加設定なしで動く。`pnpm turbo test` を回すだけでよい。
