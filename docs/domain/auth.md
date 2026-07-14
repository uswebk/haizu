# Authentication

*English first; the original Japanese is preserved below the divider.*

## Terms
- Sign-up
    - Create a new organization by entering name, company name, email, and password
    - After registration, a confirmation email (OTP) is sent; completing verification enables login
- Login
    - Authenticate with a registered email and password
- OTP (email verification)
    - Verifies identity via a one-time password emailed at sign-up
    - Valid for 10 minutes, up to 3 attempts per code
    - The verification screen can resend a code (60-second cooldown between sends). Resending issues a new code and resets the attempt count
    - If the email address itself is wrong, the verification screen offers "sign up with a different email": it drops the current session and returns to sign-up (an unverified account cannot change its email address)
- Invitation
    - An existing member (admin/site admin) invites a new member by specifying an email
    - Setting a password from the link in the invitation email enables login
    - A permission (role) is specified when inviting (see member_permission.md)
- Password reset
    - Entering an email sends a reset link
- Account settings
    - Name and email can be changed
    - Password changes are also done from this screen

## Rules
- Passwords are at least 8 characters
- Only invited members can access the organization's data
- The invitation link's validity period is TBD
- Sign-up (creating a new organization) is open to anyone. You can't join an existing organization without an invitation

## Flows
1. Sign-up -> OTP verification -> site registration -> start using the app
2. Invitation -> receive invite email -> set password -> login -> select site

---

# 認証

## 用語
- サインアップ
    - 名前・会社名・メールアドレス・パスワードを入力して組織を新規作成する
    - 登録後、確認メール（OTP）が送信され本人確認を完了することでログイン可能になる
- ログイン
    - 登録済みのメールアドレスとパスワードで認証する
- OTP（メール認証）
    - サインアップ時にメールへ送信するワンタイムパスワードで本人確認を行う
    - 有効期限は10分、1つのコードにつき試行回数は3回まで
    - 確認画面から再送信できる（再送信は60秒のクールダウンあり）。再送信すると新しいコードが発行され、試行回数もリセットされる
    - メールアドレス自体を間違えた場合は、確認画面の「別のメールアドレスで登録し直す」から現在のセッションを破棄してサインアップに戻る（未認証のアカウントはメールアドレスを変更できない）
- 招待
    - 既存メンバー（管理者・拠点管理者）がメールアドレスを指定して新規メンバーを招待する
    - 招待メールに記載のリンクからパスワードを設定することでログイン可能になる
    - 招待時に権限（ロール）を指定する（member_permission.md 参照）
- パスワードリセット
    - メールアドレスを入力するとリセットリンクが送信される
- アカウント設定
    - 名前・メールアドレスの変更が可能
    - パスワード変更も本画面から行う

## ルール
- パスワードは8文字以上
- 招待されたメンバーのみが組織のデータにアクセスできる
- 招待リンクの有効期限は TBD
- サインアップ（新規組織作成）は誰でも可能。招待なしに既存組織へは参加できない

## フロー
1. サインアップ → OTP確認 → 拠点登録 → アプリ利用開始
2. 招待 → 招待メール受信 → パスワード設定 → ログイン → 拠点選択
