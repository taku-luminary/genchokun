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
import { prisma } from "@/app/_libs/prisma";
                                                                                       
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
                                                                                       
  const response = NextResponse.redirect(new URL("/", request.url));
                                                                                       
  if (code) {                    
    const cookieStore = await cookies();
    // 今のリクエストに付いてきたCookieを扱うためのコード（データ取得してるわけではない）
    const supabase = createServerClient(
      // サーバー側で使うSupabaseクライアントを作って返す関数
      // 作られたクライアントを使うと、
      // supabase.auth.getUser()
      // supabase.from("projects").select()
      // のようなことができます。
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,                                      
      {
        cookies: {    
        // supabaseに渡すもの                                                                 
          getAll: () => cookieStore.getAll(),
          // createServerClientで使える関数、SupabaseがCookieを読みたいときに呼ばれる関数
          // supabaseに渡すsupabaseが使う関数で、createServerClientが読まれても実行されない
          setAll: (cookiesToSet) => {                                                  
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options); // レスポンスに直接セット    
            });                                                                        
          },
        },                                                                             
      }                          
    );

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);
    // Supabase Authに作られていたユーザーのメール確認を成立させ、その確認済みユーザーとしてログインセッションを作る処理 
    // ※ 上記でsupabaseがコード実行できるように事前にcreateServerClientでcookieの情報を取得している
    // exchangeCodeForSession(code) の中で起きていること（以下イメージ）
    // 1. code を Supabase Authサーバーに送る
    // 2. Supabaseが code を検証する
    // 3. code が正しければ、対応するユーザーを特定する
    // 4. そのユーザーのメール確認を完了扱いにする
    // 5. access_token / refresh_token を発行する
    // 6. セッション情報を返す
    // 7. @supabase/ssr が Cookie に保存しようとする

    if (user) {
      await prisma.users.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email ?? null,
          isActive: true,
          isAdmin: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        // callback は新規登録者だけでなく既存ユーザーも来る可能性があるため、
        // users テーブルに存在しなければ作成、存在すればそのまま通す
      });
    }
      }

      return response;
    }