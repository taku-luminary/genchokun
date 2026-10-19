import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { isSameOriginJsonRequest, NOT_SAME_ORIGIN_MESSAGE } from "@/app/_libs/isSameOriginJsonRequest";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";
import { getAuthErrorMessage } from "@/app/_libs/authErrorMessage";
import type { LoginRequest, LoginResponse } from "@/app/(auth)/login/_type/login";
import { logServerError } from "@/app/_libs/logServerError";

// POST /api/auth/login
// メールアドレスとパスワードでログインする。成功すると、ログインした状態の Cookie が返事と一緒にブラウザへ届く
export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  // 電工くんの画面以外から送られたログインは、中身を読む前に断る（CSRF 対策）
  if (!isSameOriginJsonRequest(request)) {
    return NextResponse.json({ error: NOT_SAME_ORIGIN_MESSAGE }, { status: 403 });
  }

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
      const member = await ensureUserRecord(data.user);
      // 運営が利用を停止した会員（退会を含む）は、ログインした状態を残さずに理由を返す。
      // 「ログインできたのに何も使えない」状態にしないため、ここで断る
      if (!member.isActive) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: "このアカウントは現在ご利用いただけません。お問い合わせページからご連絡ください" },
          { status: 403 }
        );
      }
    }

    // 移動先は画面側（router.push）で決めるので、API は成功したことだけを返す
    return NextResponse.json({ success: true });
  } catch (e) {
    // 想定外のエラーでも画面側が json.error を読めるよう、必ず JSON で返す
    logServerError("POST /api/auth/login", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
