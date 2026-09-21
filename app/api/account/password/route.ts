import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { verifyCurrentPassword } from "@/app/_libs/verifyCurrentPassword";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type { ChangePasswordRequest, ChangePasswordResponse } from "@/app/_types/auth";

// PUT /api/account/password
// ログイン中のユーザーが、今のパスワードで本人確認をしたうえで新しいパスワードに変更する
export async function PUT(request: Request): Promise<NextResponse<ChangePasswordResponse>> {
  try {
    const user = await getAuthUser();
    // 今のパスワードの確認にはメールアドレスが必要。
    // このアプリはメールアドレスで会員登録するので通常は必ずあるが、型の上では無い可能性もあるためチェックする
    if (!user || !user.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、画面と同じチェックをここでも行う
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `新しいパスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ログインしたままの端末を他人に触られても変更されないよう、今のパスワードで本人確認する
    const passwordError = await verifyCurrentPassword(supabase, user.email, currentPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // 本人確認に使ったのと同じクライアントで、パスワードを新しいものに更新する
    const { error } = await supabase.auth.updateUser({ password: newPassword });
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
