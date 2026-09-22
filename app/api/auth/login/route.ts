import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import type { LoginRequest, LoginResponse } from "@/app/(auth)/login/_type/login";

// POST /api/auth/login
// メールアドレスとパスワードでログインする。成功すると、ログインした状態の Cookie が返事と一緒にブラウザへ届く
export async function POST(request: Request): Promise<NextResponse<LoginResponse>> {
  try {
    const { email, password }: LoginRequest = await request.json();

    // 画面を通さずに API を直接呼ばれた場合に備えて、空欄はここでも弾く
    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: getAuthErrorMessage(error) }, { status: 400 });
    }

    // 確認メールを別端末で開いた等で callback の upsert が実行されなかった
    // ユーザーのため、ログイン成功時にも users 行を保証する
    if (data.user) {
      await ensureUserRecord(data.user);
    }

    // 移動先は画面側（router.push）で決めるので、API は成功したことだけを返す
    return NextResponse.json({ success: true });
  } catch (e) {
    // 想定外のエラーでも画面側が json.error を読めるよう、必ず JSON で返す
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
