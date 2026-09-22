// 会員登録画面（app/(auth)/signup/）と API（app/api/auth/signup/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// POST /api/auth/signup のリクエスト型
export type SignupRequest = {
  email: string;
  password: string;
};

// POST /api/auth/signup のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type SignupResponse = { success: true } | { error: string };
