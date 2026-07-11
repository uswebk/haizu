# Layout (spec) editor

*English first; the original Japanese is preserved below the divider.*

## Terms
- Layout area
  - One partitioned work area within a site ("Inspection room", "Line A", "Sorting room", etc.)
- Placement spot
  - One place within a layout area where one person is placed
- Version
  - A spec version. A spec can have multiple versions
- Floor plan
  - The area's floor plan. Uploading it makes placement easier to grasp (size adjustable)
- New version
  - The action of duplicating the current spec to create a new version
- Effective date
  - The date set at publish time. Assignment uses this version for dates on or after it
- Current spec (as of a given date)
  - Among published versions, the newest whose effective date is on or before that date (ties broken by the larger version number)

## Version states

A version has two states: "draft" or "published".

| State | What you can do |
|------|-----------|
| Draft | Edit/save spots, publish (effective date required) |
| Published | Edit/save spots, unpublish (not allowed if already used in assignment) |

```
Draft ──[publish]──▶ Published
  ▲                     │
  └────[unpublish]──────┘
        * can't unpublish if used in assignment
```

## Rules

- **An effective date is required at publish time.** For each date, assignment references "the newest published version whose effective date is on or before that date" as the current spec (ties broken by the larger version number)
- By this resolution, past dates keep referencing the version as of when they were published; publishing a new version never affects past assignments
- Multiple published versions can exist within the same area (because versions used in assignment can't be reverted to draft)
- A version used in assignment **can't be changed, deleted, or unpublished**. If a change is needed, "duplicate as a new version"
- "Duplicate current as a new version" does not create a version at the moment of duplication. It is recorded as a new version **only once you save or publish** after editing (nothing remains if you leave without saving)
- **Deleting a layout area**: if any version in the area has been used in assignment, the area can't be deleted. Deleting it removes the floor plan, all versions, and placement spots (irreversible)
  - You can't delete only an individual unused version (never used in assignment). However, a draft version isn't used in assignment unless published and remains editable, so an unneeded draft can just be left alone (little need to delete it)
- Up to 100 placement spots can be added
- On concurrent edits, last write wins
- Only admins and site admins can edit. General users can only view; others can't view
- Changes aren't reflected unless you **save**

---

# 配置(規格)エディタ

## 用語
- 配置エリア
  - 拠点内の区分けされた作業エリア1つのこと（「検収室」「ラインA」「仕分室」など）
- 配置スポット
  - 配置エリア内に人員(1人)を配置する場所1つのこと
- バージョン
  - 規格のバージョン。複数のバージョンを持てる
- 図面
  - 配置エリアの図面。アップロードすることで配置がわかりやすくなる（サイズ調整可能）
- 新バージョン
  - 現在の規格を複製して新しいバージョンを作成する操作
- 適用開始日
  - 公開時に設定する年月日。配置決めはこの日以降の日付に対してこのバージョンを使用する
- 現在の規格（ある日付における）
  - 公開済みバージョンのうち、適用開始日がその日付以前で最も新しいもの（同日なら新しいバージョン番号を優先）

## バージョンの状態

バージョンは「下書き」または「公開済み」の2つの状態を持つ。

| 状態 | できること |
|------|-----------|
| 下書き | スポットの編集・保存、公開（適用開始日の入力が必須） |
| 公開済み | スポットの編集・保存、公開取り消し（配置に使用済みの場合は不可） |

```
下書き ──[公開]──▶ 公開済み
   ▲                   │
   └────[公開を取り消す]──┘
         ※配置に使用済みは取り消し不可
```

## ルール

- **公開時には適用開始日（年月日）の入力が必須**。配置決めは日付ごとに「適用開始日がその日付以前で最も新しい公開済みバージョン」を現在の規格として参照する（同日なら新しいバージョン番号を優先）
- 上記の解決により、過去日は公開当時のバージョンのまま参照され続け、新しいバージョンの公開が過去の配置決めに影響することはない
- 同一エリア内に公開済みバージョンが複数存在することがある（配置に使用済みのバージョンは下書きに戻せないため）
- 配置決めに使用されたバージョンは**変更・削除・公開取り消しができない**。変更が必要な場合は「新バージョンを複製」して対応する
- 「現在を複製して新バージョン」は複製操作の時点ではバージョンを作成しない。編集後に**保存または公開して初めて**新バージョンとして記録される（保存せず離脱した場合は何も残らない）
- **配置エリアの削除**: エリア内のいずれかのバージョンが配置決めに使用済みの場合、そのエリアは削除できない。削除すると図面・全バージョン・配置スポットもすべて削除される（元に戻せない）
  - 未使用（配置決めに一度も使われていない）バージョンだけを個別に削除することはできない。ただし下書きバージョンは公開しなければ配置決めには使われず、編集も引き続き可能なため、不要になった下書きはそのまま放置してよい（削除の必要性は薄い）
- 配置スポットは最大100個まで追加できる
- 同時に編集された場合は、後勝ちとなる
- 編集できるのは管理者・拠点管理者のみ。一般ユーザーは閲覧のみ、その他は閲覧不可
- 編集後も**保存**を行わなければ設定に反映されない
