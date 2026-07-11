# アーキテクチャ

[English](architecture.md) · **日本語**

コードを読んだだけでは自明でなく、知らずに触ると壊す設計判断をまとめる。

## モノレポ

pnpm workspaces + Turborepo。

```
apps/web         TanStack Start (React 19) + Vite + Tailwind CSS v4 + react-konva
apps/api         Hono + Node.js + Drizzle ORM + PostgreSQL + Better Auth
packages/shared  Zod スキーマと権限マトリクス（web と api で共有）
```

`packages/shared` は `@haizu/shared` としてインポートする。両者が一致していなければならないもの — リクエスト/レスポンスのスキーマ、ロール定義、権限マトリクス — を置く。

## 現在の拠点は URL が持つ

拠点スコープの画面はすべて `/s/{siteId}/...` の下に置く。**現在の拠点は URL が唯一の真実である。** Cookie にも `localStorage` にも React の状態にも持たない。

- `apiFetch` は `x-site-id` ヘッダーを `location.pathname` から読んで組み立てる。モジュール変数で持ち回してはならない。`beforeLoad` で代入する方式だと、SSR 済みページのハイドレート時に再代入されず、ヘッダーが欠落する。
- ユーザーのロールは拠点ごとに解決されるため、`/_app/s/$siteId` の `beforeLoad` は拠点スコープの画面が描画される前に必ず走る必要がある。
- 拠点スコープでない画面（`/account`）は拠点パスの外に置く。どの拠点にも所属していないユーザーでも到達できる必要があるため。

## ロールは2つのスコープを持つ

ロールは **組織ロール** と **拠点ロール** に分かれる。

```
user(id, organization_id, role: 'admin' | 'member', is_active)
member_sites(user_id, site_id, role: 'site_admin' | 'general' | 'viewer')
```

メンバーは、A 拠点では拠点管理者、B 拠点では一般、ということができる。`admin` は組織レベルの概念で、全拠点で拠点管理者として振る舞い、`member_sites` に行を持たない。型を分けることで「A 拠点だけの管理者」という無意味な状態がコンパイルエラーになる。

`effectiveSiteRole(orgRole, siteRole)` が、この2つを「ある拠点で実際に適用されるロール」へ解決する。

**不変条件: メンバーは必ず1つ以上の拠点に所属する。** 拠点ゼロのメンバーはどの画面にも入れず、リダイレクトループを生む。この不変条件は `members.ts` の招待・更新の両方で強制している。DB 制約では保証していない。

## 権限マトリクスは1つ、読み手は2つ

`packages/shared/src/permissions.ts` が「誰が何をできるか」の唯一の情報源。**API の認可ミドルウェアと、フロントのナビ・ルートガードが同じ表を読む。** どちらか一方でルールを複製すると、そこから乖離が始まる。

- 組織スコープの操作: `canOrg(orgRole, permission)` — API は `requireOrgPermission` / `requireOrgWritePermission`
- 拠点スコープの操作: `canSite(siteRole, permission)` — API は `requireSitePermission` / `requireSiteWritePermission`。これらは `siteScope` が実効ロールを解決した後段でのみ動く
- 画面: `canAccessScreen(orgRole, siteRole, screen)` — サイドバーと `beforeLoad` ガードが使う

`requireXxxWritePermission` は `POST` / `PUT` / `PATCH` / `DELETE` だけを制限し、`GET` は素通しする。これにより、既存のルートに新しい書き込みエンドポイントを足しても自動で保護され、チェックの付け忘れに依存しない。

ロール → 権限の表では表現できない2つのルールは `apps/api/src/lib/member-role-policy.ts` にある:

- 管理者を付与できるのは管理者だけ（`evaluateOrgRoleAssignment`）
- 拠点管理者は、自分が拠点管理者である拠点のメンバーしか管理できない（`assertSitesManageable`）

権限を変更するときは `permissions.ts` **と** [`docs/domain/member_permission.md`](domain/member_permission.md) の表の両方を更新すること。

## テナント分離

拠点スコープのリクエストは、独立した2層で守られる:

1. `requireAuth` がセッションを解決し、組織をコンテキストに載せる。
2. `siteScope` が、要求された `x-site-id` がその組織に属し、かつユーザーがそのメンバーであることを検証し、実効拠点ロールを解決する。

これらに加えて、ネストしたリソース id を受け取るハンドラは、所有関係の連鎖を自分で検証しなければならない。`areas.ts` が `/:id/versions/:versionId` を `versionGuard` で守っているのはまさにこのためだ。`areaGuard` はエリアが現在拠点に属することしか証明せず、バージョンがそのエリアに属することは証明しない。
