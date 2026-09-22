import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { getEmailError } from "@/app/_utils/companyValidation";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type { SignupRequest, SignupResponse } from "@/app/(auth)/signup/_type/signup";

// POST /api/auth/signup
// メールアドレスとパスワードで会員登録し、確認メールを送る（確認メールのリンクを押すまでは、ログインできない）
export async function POST(request: Request): Promise<NextResponse<SignupResponse>> {
  try {
    const { email, password }: SignupRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、画面と同じチェックをここでも行う
    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください" },
        { status: 400 }
      );
    }
    const emailError = getEmailError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください` },
        { status: 400 }
      );
    }

    // 確認メールに関わる URL（emailRedirectTo）を、環境ごとに値が違う SITE_URL から作る
    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      // 設定漏れは利用者には直せないので、画面には一般的な文言を出し、原因はサーバーのログに残す
      console.error("SITE_URL が設定されていません");
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
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
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
