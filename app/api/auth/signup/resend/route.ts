import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  SignupResendRequest,
  SignupResendResponse,
} from "@/app/(auth)/signup/_type/signup";
import { logServerError } from "@/app/_libs/logServerError";

// POST /api/auth/signup/resend
// 会員登録の確認メールを送り直す（確認が済んでいないとログインできないため、ログイン不要の API）。
// 会員登録をやり直しても、Supabase は最初に入力したパスワードのままにする（新しく入力したパスワードではログインできない）ので、
// 確認のリンクの期限が切れた人には、やり直しではなくこちらを案内する
export async function POST(request: Request): Promise<NextResponse<SignupResendResponse>> {
  try {
    const { email }: SignupResendRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、画面と同じチェックをここでも行う。
    // getEmailError は空欄を「未入力」として null を返すので、空欄は先に別でチェックする
    if (!email || email.trim() === "") {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }
    const emailError = getEmailError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // 会員登録の API と同じく、確認メールに関わる URL（emailRedirectTo）を、環境ごとに値が違う SITE_URL から作る
    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      // 設定漏れは利用者には直せないので、画面には一般的な文言を出し、原因はサーバーのログに残す
      console.error("SITE_URL が設定されていません");
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }

    const supabase = await createClient();

    // 登録されていないアドレスや、確認が済んでいるアドレスでも、Supabase はエラーを返さず、メールも送らない。
    // 返事に違いが出ないので、そのアドレスが登録済みかどうかを他人に探られずに済む
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    if (error) {
      return NextResponse.json({ error: getAuthErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    // 想定外のエラーでも画面側が json.error を読めるよう、必ず JSON で返す
    logServerError("POST /api/auth/signup/resend", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
