// これは登録用ファイルではなく、確認メールクリック後の callback 処理用。
// callback は「登録するための必須ファイル」ではなく、「確認後にログイン完了させるためのファイル」
// 会員登録の開始は app/(auth)/signup/actions.ts の supabase.auth.signUp(...)。
// signUp(...) のあと、ユーザーは確認メールを受け取り、
// メール内リンクをクリックしてメールアドレス確認を完了する必要がある。
// このファイルは、そのリンク経由で戻ってきた URL の `code` を受け取り、
// exchangeCodeForSession(...) でログインセッションに変換するためのもの。
// つまり「登録そのもの」ではなく、「確認メールクリック後にログイン完了させるための callback 処理」。

import { NextRequest, NextResponse } from "next/server";                               
import { createServerClient } from "@supabase/ssr";                                    
import { cookies } from "next/headers";
                                                                                       
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
                                                                                       
  const response = NextResponse.redirect(new URL("/", request.url));
                                                                                       
  if (code) {                    
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,                                      
      {
        cookies: {                                                                     
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {                                                  
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options); // レスポンスに直接セット    
            });                                                                        
          },
        },                                                                             
      }                          
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}