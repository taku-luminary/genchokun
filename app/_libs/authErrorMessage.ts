import type { AuthError } from "@supabase/supabase-js";

// Supabase Auth のエラーを、画面にそのまま出せる日本語のメッセージに変える。
// error.message は英語で、文言が変わることもあるため、変わりにくい error.code を見て判定する。
// コードの一覧: https://supabase.com/docs/guides/auth/debugging/error-codes
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません";
    case "email_not_confirmed":
      return "メールアドレスの確認が済んでいません。会員登録のときに届いた確認メールのリンクから、登録を完了して下さい";
    case "email_address_invalid":
      return "このメールアドレスは使用できません。入力に誤りがないかご確認下さい";
    case "email_exists":
      return "このメールアドレスは、すでに別のアカウントで使われています";
    case "same_password":
      return "新しいパスワードは、現在のパスワードとは別にして下さい";
    case "weak_password":
      return "パスワードが簡単すぎます。より長く、推測されにくいものにして下さい";
    case "over_request_rate_limit":
      return "短時間に操作が集中しています。しばらく時間をおいて再度お試し下さい";
    case "over_email_send_rate_limit":
      return "メールの送信回数が多すぎるため、一時的に送信できません。しばらく時間をおいて再度お試し下さい";
    case "otp_expired":
      return "メールのリンクの有効期限が切れているか、すでに使われています。お手数ですが、もう一度メールを送信して下さい";
    default:
      return "処理に失敗しました。時間をおいて再度お試しください";
  }
}
