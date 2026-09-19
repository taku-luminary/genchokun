import type { AuthError } from "@supabase/supabase-js";

// Supabase Auth のエラーを、画面にそのまま出せる日本語のメッセージに変える。
// error.message は英語で、文言が変わることもあるため、変わりにくい error.code を見て判定する。
// コードの一覧: https://supabase.com/docs/guides/auth/debugging/error-codes
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "same_password":
      return "新しいパスワードは、現在のパスワードとは別にして下さい";
    case "weak_password":
      return "パスワードが簡単すぎます。より長く、推測されにくいものにして下さい";
    case "over_request_rate_limit":
      return "短時間に操作が集中しています。しばらく時間をおいて再度お試し下さい";
    default:
      return "処理に失敗しました。時間をおいて再度お試しください";
  }
}
