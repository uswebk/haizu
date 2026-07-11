# Work pattern (shift definition)

*English first; the original Japanese is preserved below the divider.*

## Terms
- Work pattern
    - The setting for how many shifts a day is divided into
    - Choose from 3 types: 1-shift, 2-shift, 3-shift
    - One per site
- Shift
    - One division within a work pattern
    - Has a name (e.g. Day, Night, Early) and start/end times
    - Assignment is done per shift (date + shift = one assignment)

## Rotation patterns
- 1-shift: one shift (e.g. 9:00-18:00)
- 2-shift: two shifts (e.g. Day 6:00-18:00 / Night 18:00-6:00)
- 3-shift: three shifts (e.g. Early / Day / Night)

## Rules
- A work pattern is set per site
- Shift names can be freely chosen, but **must not duplicate within the same work pattern**
- **Within the same work pattern, shifts with exactly matching start and end times can't be registered twice**
    - Even with different names, if both start and end match it's not allowed (e.g. "Day" 8:00-17:00 and "HQ work" 8:00-17:00 can't coexist)
    - Matching only the start or only the end is allowed (e.g. 8:00-17:00 and 8:00-18:00 can coexist)
- **Shifts are managed append-only (immutable versions)**
    - When deleting a shift, the old row is soft-deleted and a new row is inserted
    - Past assignments keep referencing the pre-edit shift row, so the shift definition at the time is preserved as history
    - Once edited, in-progress assignments linked to that shift drop out of the current shift view and remain as history
    - When a shift is deleted, assignments linked to it are reset (only hidden on the surface)
- Settings can be changed, but past assignment data is linked to the pre-change shift definition and is unaffected
- Shift choices on the assignment screen / viewer are shown based on this setting (current shifts only)

## Related domains
- Site 1 : 1 Work pattern (see site.md)
- Work pattern 1 : N Shifts
- Assignment is created per shift (see assignment.md)

---

# 勤務体制（シフト定義）

## 用語
- 勤務体制
    - 1日の勤務を何シフトに分けるかの設定
    - 1交代・2交代・3交代 の3種類から選択する
    - 拠点ごとに1つ設定する
- シフト
    - 勤務体制内の1区分のこと
    - 名称（例：日勤、夜勤、早番）と開始・終了時刻を持つ
    - 配置決めはシフト単位で行う（日付 + シフト = 1配置）

## 交代パターン
- 1交代: シフト1つ（例：9:00〜18:00）
- 2交代: シフト2つ（例：日勤 6:00〜18:00 / 夜勤 18:00〜6:00）
- 3交代: シフト3つ（例：早番 / 日勤 / 夜勤）

## ルール
- 勤務体制は拠点ごとに設定する
- シフト名は自由に命名可能。ただし**同一勤務体制内で重複不可**
- **同一勤務体制内で、開始時刻・終了時刻が完全に一致するシフトは重複登録できない**
    - シフト名が異なっていても、開始・終了が両方同じなら不可（例：「日勤」8:00〜17:00 と「本社勤務」8:00〜17:00 は共存不可）
    - 開始のみ、または終了のみが同じ場合は許可（例：8:00〜17:00 と 8:00〜18:00 は共存可）
- **シフトは append-only（不変バージョン）で管理する**
    - シフト削除時は、旧行を論理削除し、新しい行を挿入する
    - 過去の配置決めは編集前のシフト行を参照し続けるため、当時のシフト定義がそのまま履歴として保全される
    - 編集した時点で、そのシフトに紐づいていた進行中の配置は現在のシフトのビューからは外れ、履歴として残る
    - シフトが削除された場合、そのシフトに紐づく配置決めはリセット(表面上で見えなくなるだけ)される
- 設定変更は可能。ただし過去の配置データは変更前のシフト定義と紐づき影響を受けない
- 配置決め画面・配置ビュアーのシフト選択肢はこの設定に基づいて表示される（現行シフトのみ）

## 関連ドメイン
- 拠点 1 : 1 勤務体制（site.md 参照）
- 勤務体制 1 : N シフト
- 配置決めはシフト単位で作成（assign.md 参照）
