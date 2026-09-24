import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { verifyCurrentPassword } from "@/app/_libs/verifyCurrentPassword";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  AccountEmailResponse,
  ChangeEmailRequest,
  ChangeEmailResponse,
} from "@/app/mypage/settings/email/_type/emailChange";

// このルート内で使うエラーレスポンス型
type ErrorResponse = { error: string };

// GET /api/account/email
// ログイン中ユーザーの、今のログイン用メールアドレスと、確認待ちのアドレスを返す
export async function GET(): Promise<NextResponse<AccountEmailResponse | ErrorResponse>> {
  try {
    const user = await getAuthUser();
    // 変更画面はログイン用のアドレスを表示するため、アドレスが無いユーザーは扱えない
    if (!user || !user.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // new_email には「変更を申し込んだが、まだメールのリンクで確認していないアドレス」が入る。
    // 確認が終わると Supabase 側で空になるので、画面はこの値だけを見れば確認待ちかどうか分かる
    return NextResponse.json({ email: user.email, newEmail: user.new_email ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// PUT /api/account/email
// 今のパスワードで本人確認をしたうえで、新しいメールアドレスに確認メールを送る。
// この時点ではアドレスは変わらない。確認メールのリンクを開いたときに入れ替わる
export async function PUT(request: Request): Promise<NextResponse<ChangeEmailResponse>> {
  try {
    const user = await getAuthUser();
    // 今のパスワードの確認には、今のメールアドレスが必要
    if (!user || !user.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { newEmail, currentPassword }: ChangeEmailRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、画面と同じチェックをここでも行う。
    // メールアドレスは、コピーしたときに前後へ空白が入ることがあるので、取り除いてから扱う
    const email = newEmail ? newEmail.trim() : "";
    if (!email || !currentPassword) {
      return NextResponse.json(
        { error: "新しいメールアドレスと現在のパスワードを入力してください" },
        { status: 400 }
      );
    }

    const emailError = getEmailError(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    // 今と同じアドレスを渡しても、Supabase は何もせずに成功を返す（メールも届かない）。
    // 画面に「送信しました」と出たまま待ち続けることになるので、ここで弾く。
    // Supabase はアドレスを小文字にそろえて保存するため、大文字と小文字は区別せずに比べる
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "現在のメールアドレスと同じです。別のメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // 確認メールのリンク先は、環境ごとに値が違う SITE_URL から作る（会員登録・パスワード再設定と同じ）
    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      // 設定漏れは利用者には直せないので、画面には一般的な文言を出し、原因はサーバーのログに残す
      console.error("SITE_URL が設定されていません");
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }

    const supabase = await createClient();

    // ログインしたままの端末を他人に触られても変更されないよう、今のパスワードで本人確認する
    const passwordError = await verifyCurrentPassword(supabase, user.email, currentPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // 本人確認に使ったのと同じクライアントで、メールアドレスの変更を申し込む。
    // ここではまだ入れ替わらず、新しいアドレスにだけ確認メールが届く
    // （Supabase の Secure email change をオフにしているため、旧アドレスの承認は不要）
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${siteUrl}/auth/email-change` }
    );
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
