import { type NextRequest, NextResponse } from "next/server";                                            
  import { createServerClient } from "@supabase/ssr";

  const PUBLIC_PATHS = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/auth/confirm",
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/confirm",
    "/api/home",
  ];

  
  // 数字IDの企業ページ・企業APIだけを公開許可する。
  // 例: /companies/123, /api/companies/123 → 許可
  //     /api/companies/me は数字ではないので対象外（＝認証必須のまま）
  const isPublicCompanyPath = (pathname: string) =>
    /^\/companies\/\d+$/.test(pathname) || /^\/api\/companies\/\d+$/.test(pathname);
  
  export const middleware = async (request: NextRequest) => {                                              
    const ref = { response: NextResponse.next({ request }) };
                                                                                                           
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {                                                                                                    
        cookies: {
          getAll: () => request.cookies.getAll(),                                                          
          setAll: (cookiesToSet) => {
            // cookiesToSet はSupabaseが「ブラウザに保存し直してほしい」と渡してくるCookieの一覧
            ref.response = NextResponse.next({ request });
            // このリクエストはそのまま通してOKですというCookieをブラウザに返すためのレスポンス（オブジェクト）を作る
            cookiesToSet.forEach(({ name, value, options }) =>
            // Supabaseから渡されたCookie一覧を1つずつ処理する
              ref.response.cookies.set(name, value, {   
              // ブラウザに保存してほしいCookieを、レスポンスに追加する                              
                ...options,
                httpOnly: true,                                                                            
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax" as const,
              })                                                                                           
            );
          },                                                                                               
        },                         
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      !user &&
      !PUBLIC_PATHS.includes(request.nextUrl.pathname) &&
      !isPublicCompanyPath(request.nextUrl.pathname)
    ) {      const url = request.nextUrl.clone();
      url.pathname = "/login";                                                                             
      ref.response = NextResponse.redirect(url);
    }

    return ref.response;
  };

  export const config = {                                                                                  
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",                 
    ],                             
  };