// パスワード再設定の画面（app/(auth)/password-reset/）と API（app/api/auth/password-reset/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// POST /api/auth/password-reset のリクエスト型（再設定メールの送り先）
export type PasswordResetRequest = {
  email: string;
};

// POST /api/auth/password-reset/new のリクエスト型
export type NewPasswordRequest = {
  token_hash: string; // メールのリンクの URL に付いている、再設定用のトークン
  newPassword: string;
};

// 上の2つの API に共通のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type PasswordResetResponse = { success: true } | { error: string };
