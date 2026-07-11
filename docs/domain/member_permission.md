# Members & permissions

*English first; the original Japanese is preserved below the divider.*

## Premise
* A concept distinct from employees
* Mainly users who log into the system as administrators

## Terms
- Permission
    - Four exist: admin, site admin, general, other
- Invitation
    - Invite by sending an email address

## Rules
- Login
    - Login becomes possible once invited by email and the password is set
- Permissions
    - Permissions are set by "admin" and "site admin"
    - You can't change your own permission
    - "Admin" can set all permissions
    - "Site admin" can do everything except setting the permission of an "admin" or "a user belonging to another site". They also can't make a user belonging to their site a site admin of another site.
    - "General" can't set permissions
- Sites
    - Only "admin" can create/edit sites (see [site.md](./site.md) for details)
    - Viewing/operating site-linked data is limited to "admin" or members invited to that site

## Permission matrix

### Role scopes

Roles are split into two scopes.

- **Org role (OrgRole)** — `admin` / `member`. One per organization.
- **Site role (SiteRole)** — `site_admin` / `general` / `viewer`. **May differ per site.**

To express "site admin at site A, general at site B", the site role is held per site in the `member_sites` table.
`admin` is an org-scope concept and acts as a site-admin equivalent at every site (holds no row in `member_sites`).
There is no such thing as "an admin of only site A".

Summary of each role:

- **Admin** — everything
- **Site admin** — within their sites, everything except "promoting to / inviting as admin", "changing organization settings", and "creating/editing sites"
- **General** — only viewing home, assignment history, and the viewer, plus editing their own info
- **Other** — only viewing the viewer

### Org-scope operations

| Operation | Admin | Member (incl. site admin) |
|---|:--:|:--:|
| Change organization settings | ✓ | — |
| Create/edit sites | ✓ | — |
| Promote to / invite as admin | ✓ | — |

### Site-scope operations (decided by the site role at the target site)

| Operation | Site admin | General | Other |
|---|:--:|:--:|:--:|
| View/invite/change members | ✓ | — | — |
| Create/edit/delete employees | ✓ | — | — |
| Edit/publish layout areas (specs) | ✓ | — | — |
| Create/edit assignments | ✓ | — | — |
| Edit shifts (work pattern) | ✓ | — | — |
| Edit tags | ✓ | — | — |
| Edit viewer settings | ✓ | — | — |
| View assignment history | ✓ | ✓ | — |
| View site data (areas, assignments, employees, shifts) | ✓ | ✓ | ✓ |

A site admin can manage members only at **sites where they are a site admin**. They can't touch permissions at other sites.

The last row, "view site data", is allowed for "other" too because the viewer screen depends on this data.
That "other" can't reach screens beyond the viewer is enforced by screen-level permissions.

### Screens (decided by the effective role at the currently selected site)

| Screen | Admin | Site admin | General | Other |
|---|:--:|:--:|:--:|:--:|
| Home | ✓ | ✓ | ✓ | — |
| Layout areas | ✓ | ✓ | — | — |
| Assignment | ✓ | ✓ | — | — |
| Assignment history | ✓ | ✓ | ✓ | — |
| Viewer | ✓ | ✓ | ✓ | ✓ |
| Employees | ✓ | ✓ | — | — |
| Settings (shifts, tags, viewer settings) | ✓ | ✓ | — | — |
| Members | ✓ | ✓ | — | — |
| Site management | ✓ | — | — | — |
| Organization settings | ✓ | — | — | — |
| Account settings (edit own info) | ✓ | ✓ | ✓ | ✓ |

Because permissions differ per site, **the same user sees different screens depending on the selected site**.

---

# メンバー・権限

## 前提
* 従業員とは異なる概念
* 主に管理者としてシステムにログインするユーザーのこと

## 用語
- 権限
    - 管理者、拠点管理者、一般、その他 の4つが存在
- 招待
    - メールアドレスを送信して招待する
## ルール
- ログイン
    - メールアドレスを使用して招待->パスワード設定 を完了させることでログイン可能な状態となる
- 権限
    - 権限の設定は「管理者」「拠点管理者」が行う
    - 自身の権限の変更は不可
    - 「管理者」は全権限の設定が可能
    - 「拠点管理者」は「管理者」「他の拠点に属するユーザー」の権限の設定以外可能。また拠点に所属するユーザーを別の拠点管理者にすることもできない。
    - 「一般」は権限の設定ができない
- 拠点
    - 拠点の新規作成・編集ができるのは「管理者」のみ（詳細は [site.md](./site.md) 参照）
    - 拠点に紐づくデータの閲覧・操作は「管理者」または当該拠点に招待されているメンバーのみ可能

## 権限マトリクス

### ロールのスコープ

ロールは2つのスコープに分かれる。

- **組織ロール(OrgRole)** — `admin`（管理者） / `member`。組織に対して1つ。
- **拠点ロール(SiteRole)** — `site_admin`（拠点管理者） / `general`（一般） / `viewer`（その他）。**拠点ごとに異なってよい**。

「A拠点では拠点管理者、B拠点では一般」を表現するため、拠点ロールは `member_sites` テーブルが拠点ごとに持つ。
`admin` は組織スコープの概念であり、全拠点で拠点管理者相当として振る舞う（`member_sites` に行を持たない）。
「A拠点だけの管理者」という状態は存在しない。

各ロールの要約：

- **管理者** — すべて可能
- **拠点管理者** — 担当拠点内で、「管理者への昇格・管理者としての招待」「事業所設定の変更」「拠点の作成・編集」以外が可能
- **一般** — ホーム・配置履歴・ビュアーの閲覧と、自身の情報変更のみ
- **その他** — ビュアーの閲覧のみ

### 組織スコープの操作

| 操作 | 管理者 | メンバー（拠点管理者を含む） |
|---|:--:|:--:|
| 事業所設定の変更 | ✓ | — |
| 拠点の作成・編集 | ✓ | — |
| 管理者への昇格・管理者としての招待 | ✓ | — |

### 拠点スコープの操作（対象拠点における拠点ロールで判定）

| 操作 | 拠点管理者 | 一般 | その他 |
|---|:--:|:--:|:--:|
| メンバーの閲覧・招待・権限変更 | ✓ | — | — |
| 従業員の作成・編集・削除 | ✓ | — | — |
| 配置エリア（規格）の編集・公開 | ✓ | — | — |
| 配置決めの作成・編集 | ✓ | — | — |
| シフト（勤務体制）の編集 | ✓ | — | — |
| タグの編集 | ✓ | — | — |
| ビュアー設定の編集 | ✓ | — | — |
| 配置履歴の閲覧 | ✓ | ✓ | — |
| 拠点データの閲覧（エリア・配置・従業員・シフト） | ✓ | ✓ | ✓ |

拠点管理者がメンバーを管理できるのは、**自分が拠点管理者である拠点**に限る。他拠点の権限には触れられない。

最終行の「拠点データの閲覧」を「その他」にも許可しているのは、ビュアー画面がこれらのデータに依存するため。
「その他」がビュアー以外の画面へ到達できないことは画面側の権限で担保する。

### 画面（現在選択中の拠点における実効ロールで判定）

| 画面 | 管理者 | 拠点管理者 | 一般 | その他 |
|---|:--:|:--:|:--:|:--:|
| ホーム | ✓ | ✓ | ✓ | — |
| 配置エリア | ✓ | ✓ | — | — |
| 配置決め | ✓ | ✓ | — | — |
| 配置履歴 | ✓ | ✓ | ✓ | — |
| ビュアー | ✓ | ✓ | ✓ | ✓ |
| 従業員 | ✓ | ✓ | — | — |
| 設定（シフト・タグ・ビュアー設定） | ✓ | ✓ | — | — |
| メンバー | ✓ | ✓ | — | — |
| 拠点管理 | ✓ | — | — | — |
| 事業所設定 | ✓ | — | — | — |
| アカウント設定（自身の情報変更） | ✓ | ✓ | ✓ | ✓ |

拠点ごとに権限が異なるため、**同じユーザーでも選択中の拠点によって見える画面が変わる**。
