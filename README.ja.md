<div align="center">

<img src="docs/images/haizu-logo-lockup-horizontal.svg" alt="haizu" width="320">

### 工場・倉庫の「今日、誰をどこに配置するか」を、フロアマップの上で決める

工場・倉庫向けの人員配置管理 SaaS。

[![CI](https://github.com/uswebk/haizu/actions/workflows/ci.yml/badge.svg)](https://github.com/uswebk/haizu/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-24.18-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev/)

[English](README.md) · **日本語**

</div>

---

工場や倉庫の現場では、毎日「どのラインの、どの持ち場に、誰を立たせるか」を決めています。多くはホワイトボードと紙です。

**haizu** は、それをフロアマップ上で行い、確定した配置を現場のモニターに映すための Web アプリケーションです。

- 図面をアップロードし、スポットを置いて **配置エリアの規格** を作る
- 日付とシフトを選び、従業員をスポットへ **ドラッグで割り当てる**
- 確定した配置を **モニター表示専用のビュアー** に映す

<!-- TODO: 配置エディタとビュアーのスクリーンショット -->
<img src="docs/images/haizu_demo.gif" width="800">

## はじめかた

Node.js 24.18 以上（[`.nvmrc`](.nvmrc) 参照）、pnpm 10 以上、Docker が必要です。

```bash
git clone https://github.com/uswebk/haizu.git
cd haizu
pnpm install

docker compose up -d                    # PostgreSQL + Mailpit（開発用メール）

cp apps/api/.env.example apps/api/.env  # BETTER_AUTH_SECRET をランダムな32文字以上に

cd apps/api && pnpm db:migrate && pnpm db:seed && cd ../..

pnpm dev                                # web: 3000, api: 3001
```

http://localhost:3000 を開き、サインアップから会社（組織）を作成します。

> [!NOTE]
> メール送信とファイル保存はアダプタ差し替え式です。既定では実送信せず、確認コード・招待リンク・パスワードリセットは API サーバーのコンソールに `[email:console]` として出力され、アップロード画像はローカルディスク（`apps/api/uploads`）に保存されます。

### メールを実際に送って確認する（Mailpit）

`docker compose up -d` で開発用メールサーバー [Mailpit](https://github.com/axllent/mailpit) が一緒に起動します。`apps/api/.env` で `EMAIL_DRIVER=smtp` にすると、送信メールが Mailpit に届き、http://localhost:8025 の Web UI で確認できます（外部には送信されません）。

### 本番向けアダプタ

| 機能 | 環境変数 | 既定 | 本番での差し替え |
|---|---|---|---|
| メール送信 | `EMAIL_DRIVER` | `console`（コンソール出力） | `smtp` にして `SMTP_*` を実 SMTP（SendGrid / SES 等）へ向ける、または `EmailSender` を実装して `src/email/` の switch に追加 |
| ファイル保存 | `STORAGE_DRIVER` | `local`（ローカルディスク） | `FileStorage` を実装（例: S3 / GCS）し `src/storage/` の switch に追加 |

既定のままでもアプリは一通り動作します。本番アダプタの実装は歓迎します（[CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) 参照）。

### 言語とタイムゾーン

フロントエンド（`apps/web`）は、デプロイ時の既定値を2つの環境変数から読み込みます（`VITE_` 接頭辞の変数は Vite がビルド時に焼き込みます）。

| 機能 | 環境変数 | 既定 | 補足 |
|---|---|---|---|
| 言語 | `VITE_DEFAULT_LOCALE` | `en` | `en` または `ja`。デプロイ全体の既定言語。ユーザーは画面の切替UI（サイドバーのユーザーメニュー／アカウント設定）で切り替えでき、その選択は Cookie に保存されこの既定を上書きします。 |
| タイムゾーン | `VITE_DEFAULT_TIMEZONE` | *(ランタイムのTZ)* | `Asia/Tokyo` のような IANA 名。「今日」やシフト時刻の判定に使います。未設定ならランタイムのTZ（SSRはサーバーの `TZ`、クライアントはブラウザのTZ）にフォールバックします。 |

設定は `apps/web/.env` で行います。ユーザー単位のタイムゾーン設定はなく、1デプロイ＝単一拠点／単一TZ を前提としています。複数タイムゾーンにまたがる運用には拠点(site)単位のTZ設定が必要です（未実装）。

## 次に読むもの

| | |
|---|---|
| [docs/architecture.ja.md](docs/architecture.ja.md) | 知らずに触ると壊す設計判断 |
| [docs/domain/](docs/domain/) | ドメイン知識。概念ごとに1ファイル |
| [CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) | 開発コマンド・規約・PR の出し方 |

## ライセンス
MIT

---

<div align="center">
<sub>Built with TanStack Start, Hono, and Drizzle.</sub>
</div>
