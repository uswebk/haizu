# 技術決定サマリー

## 1. 技術スタック

| 層            | 採用技術                                        |
|--------------|---------------------------------------------|
| 言語           | TypeScript（フロント〜バック〜DB で統一）                 |
| 全体方針         | TypeScript フルスタック / フロントとバックは分離構成           |
| フロントエンド      | TanStack Start (v1)                         |
| ルーティング       | TanStack Router（パス/クエリの型安全）                 |
| サーバー状態管理     | TanStack Query                              |
| バックエンド       | Hono（RPC モード + REST 併用）                     |
| バリデーション      | Zod（+ @hono/zod-validator）                  |
| ORM          | Drizzle ORM                                 |
| データベース       | PostgreSQL                                  |
| 認証認可         | Better Auth                                 |
| オブジェクトストレージ  | Cloudflare R2（S3 互換、図面アップロード用）              |
| スタイル  | Tailwind CSS                                |
| 配置エディタ       | react-konva（Konva, Canvas）を中核 / dnd-kit は任意 |

## 2. ランタイム / 実行環境

- バックエンドのランタイムは **特定製品に縛らない（ランタイム非依存）**。Hono は Web 標準ベースで Node.js / Bun / Deno / Cloudflare Workers 等で動作する。
- **初期は Cloud Run 上で Node.js 実行**。無難さを優先。将来 Bun やエッジへ移行する余地は残す。
- 留意事項: Cloudflare Workers の実行ランタイムは **workerd（V8 isolate）** であり Node.js でも Bun でもない。Bun は同環境で開発ツールチェーンとしては使えるが、長時間接続・永続 TCP・CPU 時間上限の制約はランタイム由来で残る。

## 3. クラウド / インフラ構成

- **コンピュート: Cloud Run 主体**（フロント・バックを各コンテナ、scale-to-zero）。
- **DB: Neon**（サーバーレス PostgreSQL、無料枠 + scale-to-zero。Cloud Run から TCP 接続）。
- **ストレージ: Cloudflare R2**（egress 無料、S3 互換）。
- **前段に Cloudflare**（CDN / DNS / DDoS、無料プラン）。
- 初期コスト方針: **ほぼ無料で運用**（Cloud Run 無料枠 + Neon 無料枠 + Cloudflare 無料 + R2 従量）。
- コールドスタートが問題化した場合のみ Cloud Run `min-instances=1` を検討。
- 詳細（接続方式・無料枠の境界・CI/CD・リージョン等）は ADR-0006 を参照。

## 4. アーキテクチャ上の決定

- フロント/バックは **最初から分離**。型は Hono RPC（`hc<AppType>`）で共有する。
-  API は **HTTP/REST ベース**。将来のモバイルアプリ・OSS 利用者が同一 API を REST として利用できることを優先（tRPC ではなく Hono RPC を選んだ理由）。
- マルチテナントは **共有 DB・共有スキーマ**（`org_id` + `site_id` カラムで分離）。テナント構造は 2 階層（org=事業所 / site=拠点）。
-  分離は **ハイブリッド**: org 境界は **Postgres RLS で担保**（default-deny）、拠点・ロール単位の可視性は **アプリ層**で制御。主経路のクエリにも明示的に `org_id`/`site_id` を入れる（多層防御）。
- テナント文脈は **AsyncLocalStorage + トランザクションで `SET LOCAL`** により伝播。Cloud Run の TCP プールを使用（プーラー経由時は `prepare: false`）。
- RLS ポリシーは **人間のセキュリティレビュー必須**（AI 任せにしない）。クロステナント分離の自動テストを CI 必須とする。
- 認証認可は **Better Auth の organization プラグイン**を採用。**org = 事業所（RLS の org_id）/ team = 拠点（site_id）** にマッピング。
- 4 ロール（管理者/拠点管理者/一般/その他）は **createAccessControl でカスタム定義**（デフォルトの owner/admin/member は使わない）。
- 認可は 3 分割: **何ができるか = Better Auth AC / どの org = RLS / どの拠点 = アプリ層（team 所属 + site_id）**。
- **テナント文脈の確立は Hono 認証ミドルウェアに集約**（セッション解決 → AsyncLocalStorage → `SET LOCAL app.current_org`）。認証とテナント文脈の単一確立点。
- `[要検討]` セッションは **DB ベースのクッキーセッション**（失効可能）。JWT は当面不採用。認証は **email+password** から開始（social/passkey/magic-link は将来）。
- **MVP では従業員（ワーカー）は認証ユーザーではなくデータ**（CSV レコード）。従業員ログインは将来のモバイルアプリ。
- 配置エディタは **react-konva（Konva, Canvas）を中核**とする。背景図面の上に人員/設備を自由配置し、ズーム/パン・D&D・変形を扱う。
- 配置状態は **Konva のシリアライズ（toJSON / Node.create）で永続化**し、バージョン管理・配置履歴・ビュアー復元に用いる。
- 配置ビュアーは同一シーンを **読み取り専用（draggable=false / listening=false）** で描画して実現する。
- エディタは TanStack Start 上で **client-only 境界（dynamic import）** として実装する（react-konva は SSR 非対応のため）。
- dnd-kit は **DOM 側パレット UX が必要な場合のみ補助採用**（初期は依存に含めない）。

## 5. 開発の前提

- AI ネイティブ開発（詳細設計・デザイン・タスク化・実装・テスト[Unit/E2E] で AI を活用）。
- 提供形態は段階的: OSS化。OSS セルフホストのしやすさを設計上考慮する。
