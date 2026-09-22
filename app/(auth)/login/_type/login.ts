// ログイン画面（app/(auth)/login/）と API（app/api/auth/login/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// POST /api/auth/login のリクエスト型（ログインフォームの入力欄とも同じ形）
export type LoginRequest = {
  email: string;
  password: string;
};

// POST /api/auth/login のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type LoginResponse = { success: true } | { error: string };
