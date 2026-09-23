// ログイン用メールアドレスの変更画面（app/mypage/settings/email/）と API（app/api/account/email/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// GET /api/account/email のレスポンス型（今のログイン用メールアドレスと、確認待ちのアドレス）
export type AccountEmailResponse = {
  email: string;
  newEmail: string | null; // 変更を申し込んだが、まだメールのリンクで確認していないアドレス。無ければ null
};

// PUT /api/account/email のリクエスト型（変更フォームの入力欄とも同じ形）
export type ChangeEmailRequest = {
  newEmail: string;
  currentPassword: string; // 本人確認のための今のパスワード
};

// PUT /api/account/email のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type ChangeEmailResponse = { success: true } | { error: string };
