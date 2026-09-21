import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type {
  NewPasswordRequest,
  PasswordResetResponse,
} from "@/app/(auth)/password-reset/_type/passwordReset";

// POST /api/auth/password-reset/new
// 再設定メールのリンクから来た人が、新しいパスワードを設定する（ログインできない人が使うため、ログイン不要の API）。
// トークンの確認（verifyOtp）とパスワードの更新（updateUser）を、送信ボタンを押したときの1回のリクエストでまとめて行う。
// リンクを開いただけではトークンを使わないので、メールのスキャナがリンクを先読みしても無効にならない（/api/auth/confirm と同じ考え方）
export async function POST(request: Request): Promise<NextResponse<PasswordResetResponse>> {
  try {
    const { token_hash, newPassword }: NewPasswordRequest = await request.json();

    // トークンは1回しか使えないので、入力のチェックはトークンを使う前にすべて済ませる。
    // 先に使ってしまうと、入力ミスを直して送り直しても「使用済み」になり、メールの取り直しになるため
    if (!token_hash) {
      return NextResponse.json(
        { error: "リンクが正しくありません。メールのリンクから開き直すか、もう一度メールを送信して下さい" },
        { status: 400 }
      );
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `新しいパスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // トークンを確かめる。成功すると、そのユーザーとしてログインした状態（セッション）がこのクライアントに入り、
    // ブラウザの Cookie にも保存される
    const { error: verifyError } = await supabase.auth.verifyOtp({ type: "recovery", token_hash });
    if (verifyError) {
      return NextResponse.json({ error: getAuthErrorMessage(verifyError) }, { status: 400 });
    }

    // verifyOtp でログインした状態になった、同じクライアントでパスワードを更新する
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    // same_password（今と同じパスワード）はエラーにしない。
    // 今のパスワードを思い出せていて、ログインもできているため。
    // エラーにしても、トークンは使用済みで同じリンクからは送り直せず、メールの取り直しになってしまう
    if (updateError && updateError.code !== "same_password") {
      return NextResponse.json({ error: getAuthErrorMessage(updateError) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    // 想定外のエラーでも画面側が json.error を読めるよう、必ず JSON で返す
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
