// POST にする理由:
//  - メール確認は「状態を変える」操作なので、HTTPの作法上 POST が適切。
//  - Gmail 等のスキャナはリンクを先読み(GET)するが POST はしないため、
//    使い捨てトークンをスキャナに消費されるのを防げる。

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";
import type { ConfirmRequest, ConfirmResponse } from "@/app/auth/_type/confirm";

// 会員登録の確認（type: "signup"）と、ログイン用メールアドレス変更の確認（type: "email_change"）が
// 共通で使う。どちらも token_hash を確かめ、成功すればログインした状態の Cookie を返す
export async function POST(request: NextRequest): Promise<NextResponse<ConfirmResponse>> {
  const { token_hash, type }: ConfirmRequest = await request.json();

  if (!token_hash || !type) {
    return NextResponse.json(
      { error: "確認情報が不足しています" },
      { status: 400 }
    );
  }

  // 成功時の返事。ここに確認後のログインセッションCookieを書き込む。
  const response = NextResponse.json<ConfirmResponse>({ success: true });

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

  // token_hash だけで確認を成立させ、同時にログインセッションを発行する。
  // 秘密(code_verifier)が不要なので、別ブラウザ・別端末・代理登録でも成功する。
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "確認に失敗しました。リンクの有効期限が切れている可能性があります。" },
      { status: 400 }
    );
  }

  // メール確認は成功済み。users 行の作成やメールアドレスの更新に失敗しても確認を無効化しないよう、
  // ログだけ残して成功として扱う（users 行はログイン時にも保証され自己修復できる）。
  try {
    await ensureUserRecord(data.user);
  } catch (e) {
    console.error("ensureUserRecord failed after email confirm:", e);
  }

  return response;
}
