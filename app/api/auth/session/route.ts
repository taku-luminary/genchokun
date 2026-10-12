import { NextResponse } from "next/server";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { createClient } from "@/app/_libs/supabase/server";
import type { AuthSessionResponse } from "@/app/_types/auth";

// GET /api/auth/session
// いまログインしている会員の ID を返す（未ログインなら null）。
// ブラウザ側（AuthChangeWatcher など）が、ページを表示したときの会員と比べて、
// ほかのタブでのログアウトや会員の入れ替わりに気づくために使う。
// 未ログインでも答える必要があるので、ログイン不要の API にしている（proxy.ts の PUBLIC_PATHS）
export async function GET(): Promise<NextResponse<AuthSessionResponse>> {
  // 答えは会員ごと・ログインの状態ごとに変わるので、ブラウザにも途中の配信網にも保存させない
  const headers = { "Cache-Control": "no-store" };

  const supabase = await createClient();
  // ヘッダーと同じ getUser で確かめる。停止中などで機能を使えない会員も、ヘッダーと同じく「その会員」として答える
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 認証サーバーに一時的に届かないときは、ログアウトと見分けられないので「確かめられない」と返す。
  // ログアウトと答えると、ブラウザ側が入力中の画面を読み込み直してしまうため
  if (error && isAuthRetryableFetchError(error)) {
    return NextResponse.json(
      { error: "ログインの状態を確認できませんでした" },
      { status: 503, headers }
    );
  }

  return NextResponse.json({ userId: user?.id ?? null }, { headers });
}
