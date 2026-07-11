# Assignment

*English first; the original Japanese is preserved below the divider.*

## Terms
- Shift
    - A daily work division like date + Day, Night
    - Work style is set per site
        - 10:00-19:00 is Day
        - 19:00-09:00 is Night
- Confirm
    - Confirms the assignment; it appears in the viewer
    - The placement can still be changed after confirming
- Draft
    - Not shown in the viewer

## Rules
- Employees can be assigned only to spots of a **published spec** (draft specs can't be assigned; see layout_spec.md)
    - Which version applies is determined by the assignment's target date and the spec's **effective date** ("current spec" = the newest published version whose effective date is on or before the target date; see layout_spec.md). Versions whose effective date is after the target date can't be assigned
    - Even after publishing a new version, past-date assignments with an earlier effective date keep referencing the original version and remain editable
- A spec version used in assignment can no longer be **edited (spot/floor-plan changes) or unpublished** (see layout_spec.md). To change the spec, duplicate a new version
- Shifts follow the site's work pattern (see work_pattern.md). If the work style is "no shifts", assignment is a single per-date (all-day) entry
    - Because shifts are append-only, changing a shift's name/time after assignment keeps that assignment referencing the pre-change shift definition (see work_pattern.md)
- There is only one assignment per "layout area × date × shift" combination (draft or confirmed)
- Confirmed/draft states can be toggled any number of times (confirm -> revert to draft -> confirm again, etc.)
- Duplicate employees within the same shift are allowed (a warning is shown)
    - To support employees who move between multiple areas
- You can't place more people than the spec allows
- You can't place employees outside the spec's spots
    - The spec must be changed

## Misc
- Filtering by employee tags is supported
- Assign by tapping a placement spot, or by drag & drop
- Tapping a placement spot shows details of the assigned employee, etc.

# Assignment history
## Terms
- Assignment history
    - A feature to review past confirmed assignment records
    - Viewed by specifying a date (read-only)
- Memo
    - A text memo can be left on an assignment
    - Used for later review / handover
- CSV export
    - Assignment records can be downloaded as CSV
    - Export by specifying a period

## Rules
- Only confirmed assignments are viewable as history (drafts excluded)
- View permission: admin, site admin, general (see member_permission.md)
- Past assignments can't be changed (tracked as a change log only)

---

# 配置決め
## 用語
- シフト
    - 日付+日勤, 夜勤 などの1日あたりの勤務体制のこと
    - 拠点ごとに働き方を設定する
        - 10:00~19:00 が日勤
        - 19:00~09:00 が夜勤
- 確定
    - 配置決めを確定させ、配置ビュアーに表示される
    - 確定後も配置の変更は可能
- 下書き
    - 配置ビュアーには表示されない
## ルール
- **公開済みの配置規格**のスポットに対してのみ従業員を割り当てられる（下書きの規格には配置決めできない。layout_spec.md 参照）
    - どのバージョンが対象になるかは、配置決めの対象日と規格の**適用開始日**で決まる（「現在の規格」= 対象日時点で適用開始日がその日以前の公開済みバージョンのうち最新のもの。layout_spec.md 参照）。適用開始日が対象日より後のバージョンでは配置決めできない
    - 新しいバージョンを公開しても、それ以前の適用開始日を持つ過去日の配置決めは元のバージョンのまま参照され、編集可能であり続ける
- 配置決めに使用された配置規格バージョンは、以後**編集（スポット変更・図面変更）・公開取り消し**ができなくなる（layout_spec.md 参照）。規格を変更したい場合は新バージョンを複製して対応する
- シフトは拠点の勤務体制（work_pattern.md 参照）に基づく。働き方が「シフトなし」の場合、配置決めは日付単位（終日）で1件になる
    - シフトは append-only で管理されるため、配置決め後にシフトの名称・時刻を変更しても、その配置決めは変更前のシフト定義を参照し続ける（work_pattern.md 参照）
- 配置決めは「配置エリア × 日付 × シフト」の組み合わせにつき1件のみ（下書き・確定を問わず）
- 確定・下書きの状態は何度でも往復できる（確定 → 下書きに戻す → 再度確定、など）
- 同じシフトに従業員重複は可能(警告を表示する)
    - 例えば複数エリアを行き来したりする従業員に対応するため
- 規格以上の人数は配置できない
- 規格以外の場所に従業員配置できない
    - 規格の変更が必要
## その他
- 従業員のタグで絞り込み可能とする
- 配置スポットをタップして従業員を割り当てるか、D&Dで割り当てる
- 配置スポットをタップすることで、設定されている従業員の詳細などが表示される

# 配置履歴
## 用語
- 配置履歴
    - 確定済みの過去の配置実績を参照する機能
    - 日付を指定して閲覧する（読み取り専用）
- メモ
    - 配置に対してテキストメモを残すことができる
    - 後から振り返り・引き継ぎに使用する
- CSVエクスポート
    - 配置実績をCSV形式でダウンロードできる
    - 期間を指定してエクスポート

## ルール
- 確定状態の配置のみが履歴として参照可能（下書きは対象外）
- 閲覧権限: 管理者・拠点管理者・一般（member_permission.md 参照）
- 過去の配置の変更はできない（変更ログとして追跡のみ）
