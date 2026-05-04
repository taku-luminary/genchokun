import { type NextRequest, NextResponse } from "next/server";                                            
  import { createServerClient } from "@supabase/ssr";

  const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback", "/api/auth/signup",  
    "/api/auth/login","/api/home",];  
  
  export const middleware = async (request: NextRequest) => {                                              
    const ref = { response: NextResponse.next({ request }) };
                                                                                                           
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {                                                                                                    
        cookies: {
          getAll: () => request.cookies.getAll(),                                                          
          setAll: (cookiesToSet) => {
            ref.response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              ref.response.cookies.set(name, value, {                                                      
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

    if (!user && !PUBLIC_PATHS.includes(request.nextUrl.pathname)) {                                       
      const url = request.nextUrl.clone();
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