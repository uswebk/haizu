# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**haiz** は工場・倉庫などの現場における人員配置管理SaaSです。フロアマップ上で従業員の配置を管理・割り当て・閲覧するWebアプリケーションです。

## Monorepo Structure

pnpm + Turborepo 構成：

- `apps/web` — フロントエンド（TanStack Start + React + Vite + Tailwind CSS）
- `apps/api` — バックエンドAPI（Hono + Node.js、ポート3001）
- `packages/shared` — Zodスキーマ共有ライブラリ（`@haiz/shared`）

## Commands

```bash
# ルートから全アプリ起動
pnpm dev

# 個別起動
cd apps/web && pnpm dev   # http://localhost:3000
cd apps/api && pnpm dev   # http://localhost:3001

# ビルド・型チェック
pnpm build
pnpm typecheck

# Lintと整形（apps/web）
cd apps/web
pnpm lint      # biome lint
pnpm check     # biome check（lint + format）
pnpm format    # biome format

# テスト（apps/web）
cd apps/web && pnpm test          # vitest run（全件）
cd apps/web && pnpm vitest <file> # 単一ファイル

# DB（apps/api）
cd apps/api
pnpm db:generate   # drizzle-kit generate
pnpm db:migrate    # drizzle-kit migrate
pnpm db:push       # drizzle-kit push
pnpm db:studio     # Drizzle Studio

# DB起動
docker compose up -d
```

## Architecture

### フロントエンド（`apps/web`）

- **ルーティング**: TanStack Router（ファイルベース、`src/routes/`）。`routeTree.gen.ts` は自動生成のため編集不可。
- **レイアウト**: `_app.tsx` がサイドバー＋ヘッダーの共通レイアウト。全ページは `/_app/` 配下。
- **キャンバス**: フロアプラン編集に `react-konva`（Konva.js）を使用（`features/editor/`）。
- **パスエイリアス**: `#/*` → `./src/*`（`package.json` の `imports` で定義）。
- **スタイル**: Tailwind CSS v4（カスタムカラートークンを使用）。
  - Tailwindの任意値 `[Npx]` は使わず、標準スケールまたはカスタムトークンを使うこと
  - 標準スケールに存在しない値（`text-[13px]`、`rounded-[9px]` など）は任意値のまま使用してよい

### ルート構成

| パス | 機能 |
|------|------|
| `/home` | ホーム |
| `/editor` | 配置エリア編集（フロアマップ＋スポット管理） |
| `/assignment` | 日付・シフト別の配置割り当て |
| `/history` | 配置履歴 |
| `/viewer` | 表示専用ビュアー（モニター表示用） |
| `/employees` | 従業員管理 |
| `/members` | メンバー・権限管理 |
| `/settings` | 管理者設定 |

### バックエンド（`apps/api`）

- **Hono** + `@hono/node-server`（Node.js）でREST API
- **Drizzle ORM** + PostgreSQL（`apps/api/src/db/`）
- **Better Auth** で認証
- DBスキーマは `apps/api/src/db/schema.ts` に追加する

### 共有ライブラリ（`packages/shared`）

`@haiz/shared` としてインポート。以下のZodスキーマを提供：

- `organization` / `site` — 組織・拠点
- `employee` — 従業員
- `work_pattern` — 勤務シフトパターン（1〜3交代制）
- `layout_spec` — 配置規格（バージョン管理、フロアマップ画像、スポット定義）
- `assignment` — 配置割り当て（規格に対して従業員をアサイン）
- `user` — ユーザー

## Domain Concepts

- **拠点 (Site)**: 工場・倉庫などの物理的な場所。1組織が複数拠点を持てる。
- **配置規格 (Layout Spec)**: フロアマップ画像＋スポット（人員を配置する位置）の定義。バージョン管理あり。
- **配置割り当て (Assignment)**: 日付・シフトを指定して、規格の各スポットに従業員をアサインすること。
- **権限**: 管理者（全拠点）/ 拠点管理者 / 一般 / その他 の4段階。

## Development Notes

- フロントエンドのルートファイルを追加・変更したら `pnpm generate-routes`（または `tsr generate`）でルートツリーを再生成する。
- `biome` を使用しているため `eslint` / `prettier` は不要。
- `@haiz/shared` のスキーマ変更は `packages/shared/src/schemas/` を編集し、`src/index.ts` からエクスポートする。
- `{/* Body */}` のような、コードを読めば自明なコメントは書かない・復元しない。コメントはWHY（非自明な制約・理由）がある場合のみ付ける。
