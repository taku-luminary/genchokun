import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  PasswordResetRequest,
  PasswordResetResponse,
} from "@/app/(auth)/password-reset/_type/passwordReset";

// POST /api/auth/password-reset
// パスワードを忘れた人に、再設定用のリンクをメールで送る（ログインできない人が使うため、ログイン不要の API）
export async function POST(request: Request): Promise<NextResponse<PasswordResetResponse>> {
  try {
    const { email }: PasswordResetRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、画面と同じチェックをここでも行う。
    // getEmailError は空欄を「未入力」として null を返すので、空欄は先に別でチェックする
    if (!email || email.trim() === "") {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }
    const emailError = getEmailError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // メールのリンクの行き先を、ローカルでは localhost、本番では本番 URL にするため、環境ごとに値が違う SITE_URL を使う
    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      // 設定漏れは利用者には直せないので、画面には一般的な文言を出し、原因はサーバーのログに残す
      console.error("SITE_URL が設定されていません");
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }

    const supabase = await createClient();

    // 登録されていないアドレスでも、Supabase はエラーを返さず、メールも送らない。
    // 返事に違いが出ないので、そのアドレスが登録済みかどうかを他人に探られずに済む
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/password-reset/new`,
    });
    if (error) {
      return NextResponse.json({ error: getAuthErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    // 想定外のエラーでも画面側が json.error を読めるよう、必ず JSON で返す
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
