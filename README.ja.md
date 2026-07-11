<div align="center">

<img src="docs/images/haizu-logo-lockup-horizontal.svg" alt="haizu" width="320">

### 工場・倉庫の「今日、誰がどこに立つか」を、フロアマップの上で決める

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

## はじめかた

Node.js 24.18 以上（[`.nvmrc`](.nvmrc) 参照）、pnpm 10 以上、Docker が必要です。

```bash
git clone https://github.com/uswebk/haizu.git
cd haizu
pnpm install

docker compose up -d                    # PostgreSQL

cp apps/api/.env.example apps/api/.env  # BETTER_AUTH_SECRET をランダムな32文字以上に

cd apps/api && pnpm db:migrate && pnpm db:seed && cd ../..

pnpm dev                                # web: 3000, api: 3001
```

http://localhost:3000 を開き、サインアップから会社（組織）を作成します。

> [!NOTE]
> 開発環境ではメール送信が未実装です。確認コード・招待リンク・パスワードリセットは、API サーバーのコンソールに `[dev-email]` として出力されます。

## 次に読むもの

| | |
|---|---|
| [docs/architecture.ja.md](docs/architecture.ja.md) | 知らずに触ると壊す設計判断 |
| [docs/domain/](docs/domain/) | ドメイン知識。概念ごとに1ファイル |
| [CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) | 開発コマンド・規約・PR の出し方 |

## ライセンス

未定です。公開前に決定します。

---

<div align="center">
<sub>Built with TanStack Start, Hono, and Drizzle.</sub>
</div>
