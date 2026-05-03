import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

  export async function createClient() {
    const cookieStore = await cookies()
    // 今のリクエストに付いてきたCookieを扱うためのコード（データ取得してるわけではない）

    return createServerClient(
      // サーバー側で使うSupabaseクライアントを作って返す関数
      // 作られたクライアントを使うと、
      // supabase.auth.getUser()
      // supabase.from("projects").select()
      // のようなことができます。
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // どのSupabaseプロジェクトに接続するのか
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      // Supabaseにアクセスするための鍵
      {
        cookies: {
        // supabaseに渡すもの
          getAll() {
          // createServerClientで使える関数、SupabaseがCookieを読みたいときに呼ばれる関数
          // supabaseに渡すsupabaseが使う関数で、createServerClientが読まれても実行されない
            return cookieStore.getAll()
            // ユーザーのcookie情報を取得する
          },
          setAll(cookiesToSet) {
          // SupabaseがCookieを書き換えたいときに呼ばれる関数
          // supabaseに渡すsupabaseが使う関数で、createServerClientが読まれても実行されない
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component からは Cookie を書き込めないため無視
              // middleware.ts が代わりに処理する
            }
          },
        },
      }
    )
  }