import type { EmailOtpType } from "@supabase/supabase-js";

// メールのリンクから開く確認画面（app/auth/confirm = 会員登録、app/auth/email-change = メールアドレスの変更）と、
// 2つが共通で使う API（app/api/auth/confirm/）の型。
// app/auth/ の中だけで使うため、グローバルの app/_types ではなくこのフォルダに置く

// POST /api/auth/confirm のリクエスト型
export type ConfirmRequest = {
  token_hash: string; // メールのリンクの URL に付いている、確認用のトークン
  type: EmailOtpType; // 何の確認か（会員登録の確認メールのリンクは "email"、メールアドレスの変更は "email_change"）
  agreedToTerms?: boolean; // 会員登録の確認画面で「利用規約に同意して登録を完了する」を押したときだけ true（メールアドレスの変更では送らない）
  termsVersion?: string; // 同意するときに、画面に表示した利用規約の版の値（例 "terms-v1.1"）。今の版と違えば確認も記録もしない
};

// POST /api/auth/confirm のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type ConfirmResponse = { success: true } | { error: string };
