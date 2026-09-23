import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";

// 今のパスワードが正しいかを確かめる共通関数（パスワードの変更と、ログイン用メールアドレスの変更で使う）。
// Supabase には「パスワードが合っているかだけ」を調べる関数がないため、
// そのメールアドレスとパスワードで実際にログインを試し、成功したかどうかで判定する。
//
// supabase には呼び出し側と同じクライアントを受け取る。
// ログインに成功すると新しいセッション（ログイン状態）がこのクライアントに入り、
// 続けて呼ぶ updateUser がその新しいセッションで実行されるため
// （Supabase の「Secure password change」がオンでも、直前にログインしたので再認証を求められない）。
//
// この確認が効くのは、電工くんの API を通る操作だけ。有効なセッションを持つ相手は
// Supabase Auth を直接呼べるため、セッションを盗まれた場合の防御にはならない。
// そこまで防ぐには Supabase 側の設定（Secure email change / Secure password change）が必要になる。
//
// 返り値：問題なければ null、問題があれば画面に出すエラーメッセージ（app/_utils/companyValidation.ts と同じ形）
export async function verifyCurrentPassword(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;

  // Supabase では、ログインに失敗すると「メールアドレスかパスワードが違う」の意味で invalid_credentials になる。
  // email はログイン中ユーザー本人のものなので、ここではパスワードが違うと判断できる
  if (error.code === "invalid_credentials") {
    return "現在のパスワードが正しくありません";
  }
  return getAuthErrorMessage(error);
}
