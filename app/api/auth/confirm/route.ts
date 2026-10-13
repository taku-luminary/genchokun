// POST にする理由:
//  - メール確認は「状態を変える」操作なので、HTTPの作法上 POST が適切。
//  - Gmail 等のスキャナはリンクを先読み(GET)するが POST はしないため、
//    使い捨てトークンをスキャナに消費されるのを防げる。

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";
import { recordTermsAgreement } from "@/app/_libs/recordTermsAgreement";
import { COOKIE_OPTIONS } from "@/app/_libs/supabase/cookieOptions";
import type { ConfirmRequest, ConfirmResponse } from "@/app/auth/_type/confirm";
import { logServerError } from "@/app/_libs/logServerError";

// 会員登録の確認（メールのリンクの type は "email"）と、ログイン用メールアドレス変更の確認（type: "email_change"）が
// 共通で使う。どちらも token_hash を確かめ、成功すればログインした状態の Cookie を返す
export async function POST(request: NextRequest): Promise<NextResponse<ConfirmResponse>> {
  // JSON として読めない送信は、確認情報が足りないものとして 400 にする。
  // 読み取りの失敗をそのまま投げると、送られた文字列の一部（トークンを含みうる）がエラーとしてログに残るため
  let body: ConfirmRequest | null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const token_hash = body?.token_hash;
  const type = body?.type;

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
            // Supabase が渡す options を残したうえで、httpOnly などの安全側の設定で上書きする
            response.cookies.set(name, value, { ...options, ...COOKIE_OPTIONS });
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
    logServerError("POST /api/auth/confirm ensureUserRecord", e);
  }

  // 会員登録の確認画面で「利用規約に同意して登録を完了する」が押されたときだけ、同意を記録する。
  // メールアドレス変更の確認（同じ API を使う）はこの印を送らないので、記録しない。
  // 記録に失敗しても確認は成功として扱い、ログだけ残す（同意はログイン後のヘッダーの案内からやり直せる）
  if (body?.agreedToTerms === true) {
    try {
      await recordTermsAgreement(data.user.id, "signup_confirm");
    } catch (e) {
      logServerError("POST /api/auth/confirm recordTermsAgreement", e);
    }
  }

  return response;
}
