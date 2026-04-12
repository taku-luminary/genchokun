// これは登録用ファイルではなく、確認メールクリック後の callback 処理用。
// callback は「登録するための必須ファイル」ではなく、「確認後にログイン完了させるためのファイル」
// 会員登録の開始は app/(auth)/signup/actions.ts の supabase.auth.signUp(...)。
// signUp(...) のあと、ユーザーは確認メールを受け取り、
// メール内リンクをクリックしてメールアドレス確認を完了する必要がある。
// このファイルは、そのリンク経由で戻ってきた URL の `code` を受け取り、
// exchangeCodeForSession(...) でログインセッションに変換するためのもの。
// つまり「登録そのもの」ではなく、「確認メールクリック後にログイン完了させるための callback 処理」。

import { NextResponse } from "next/server";
  import { createClient } from "@/app/_libs/supabase/server";

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL("/", request.url));
  }