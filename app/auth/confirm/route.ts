// このファイルの目的:
// 確認メールのリンクを踏んだあとに「メール確認」を成立させる処理。
//
// なぜ verifyOtp なのか:
// 以前の /auth/callback は exchangeCodeForSession を使っていた。
// これは「登録したブラウザにしか無い秘密(code_verifier)」が必要なため、
// 代理登録＋別ブラウザだと確認が完了しなかった。
// verifyOtp は token_hash だけで確認できる（秘密が不要）ので、
// どの端末・どのブラウザで開いても確実にメール確認が成立する。

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // メールのリンクに付いてくる確認用の情報
  const tokenHash = searchParams.get("token_hash");
  // type はメール文面で "email" を渡す。値はURL由来の文字列なので、
  // Supabase が期待する型(EmailOtpType)に合わせる。値は自分たちのメール文面で
  // 決めているので安全。
  const type = searchParams.get("type") as EmailOtpType | null;

  // 確認成功時の遷移先。ここに「確認後のログインセッション」を書き込む。
  const response = NextResponse.redirect(new URL("/", request.url));

  if (tokenHash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // token_hash だけでメール確認を成立させ、同時にログインセッションを発行する。
    // 秘密(code_verifier)が不要なので、別ブラウザ・別端末でも成功する。
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error && data.user) {
      // 確認と同時にログイン状態になる。アプリ側の users 行が無ければ作る。
      await ensureUserRecord(data.user);
      return response;
    }
  }

  // token_hash が無い・期限切れ・不正などで確認できなかった場合はログイン画面へ。
  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
