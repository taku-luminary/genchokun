// PUT /api/account/password のリクエスト型（画面 → API に送る内容）
export type ChangePasswordRequest = {
  currentPassword: string; // 本人確認のための今のパスワード
  newPassword: string;
};

// PUT /api/account/password のレスポンス型（API → 画面に返る内容）
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type ChangePasswordResponse = { success: true } | { error: string };
