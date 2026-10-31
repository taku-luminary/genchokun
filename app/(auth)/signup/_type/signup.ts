// 会員登録の画面（app/(auth)/signup/）・確認メールの再送の画面（app/(auth)/signup/resend/）と、
// それぞれの API（app/api/auth/signup/・app/api/auth/signup/resend/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// POST /api/auth/signup のリクエスト型
export type SignupRequest = {
  email: string;
  password: string;
};

// POST /api/auth/signup のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type SignupResponse = { success: true } | { error: string };

// POST /api/auth/signup/resend のリクエスト型（会員登録の確認メールを送り直す）
export type SignupResendRequest = {
  email: string;
};

// POST /api/auth/signup/resend のレスポンス型（形は会員登録と同じ）
export type SignupResendResponse = { success: true } | { error: string };
