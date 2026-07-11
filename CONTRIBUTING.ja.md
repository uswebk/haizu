# コントリビュート

[English](CONTRIBUTING.md) · **日本語**

Issue と Pull Request を歓迎します。

## はじめる前に

触る領域に対応する [`docs/domain/`](docs/domain/) のドキュメントと、横断的な設計判断（拠点の URL 表現、権限モデル、規格のバージョン管理）については [`docs/architecture.ja.md`](docs/architecture.ja.md) を読んでください。いくつかはコードを読んだだけでは自明でなく、知らずに触ると壊します。

## 開発コマンド

特記がなければリポジトリのルートから実行します。

```bash
pnpm dev            # 全アプリ起動（web: 3000, api: 3001）
pnpm build          # 全パッケージのビルド
pnpm typecheck      # 全パッケージの型チェック
pnpm test           # テスト

cd apps/web && pnpm check      # Biome: lint + format

cd apps/api
pnpm db:generate    # schema.ts の変更からマイグレーション生成
pnpm db:migrate     # マイグレーション適用
pnpm db:push        # マイグレーションを作らずスキーマを反映 — ローカルの一時的な試行のみ
pnpm db:studio      # Drizzle Studio
```

## 規約

- **Lint と整形** は Biome（ESLint/Prettier ではない）。警告を `biome-ignore` で黙らせず、原因を解消してください。ルールに例外がどうしても必要な場合は、自己判断せず PR で相談してください。
- **コメント** は WHY（非自明な制約や理由）を書くときだけ。コードを読めば分かることを繰り返すコメントは書かないでください。
- **Tailwind** はプロジェクトのカスタムカラートークンを使います。標準スケールやトークンで表せる値に `text-[13px]` のような任意値を使わないでください。

## DB スキーマの変更

`apps/api/src/db/schema.ts` を編集したら:

1. `pnpm db:generate` でマイグレーションファイルを生成
2. `pnpm db:migrate` で適用
3. 生成された `src/db/migrations/*.sql` と `meta/` をコミット

`pnpm db:push` はローカルの使い捨ての試行にのみ使ってください。確定する変更は必ず生成したマイグレーションにします。

## ルーティング

`apps/web/src/routeTree.gen.ts` は自動生成です。手で編集しないでください。`src/routes/` 配下のルートファイルを追加・リネーム・移動したら、`pnpm generate-routes`（または `tsr generate`）を実行して結果をコミットしてください。

## Pull Request

- `pnpm typecheck` と `pnpm test` が通ることを確認してください。
- 無関係な変更はコミットを分けてください。バグ修正とリファクタを同じコミットに混ぜないこと。
- CI は全 PR で Biome・型チェック・テストを実行します。
