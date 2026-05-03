import { createClient } from "@/app/_libs/supabase/server";                            
 
// ログイン中のユーザーを返す共通関数                     
// 未ログインの場合は null を返す
export async function getAuthUser() {                     
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();     
    // SupabaseがCookieを見てトークンをもとに「この人はログイン済みか」を確認をして、supabaseのユーザー情報を返す） ※ 事前にcreateClientでcookieの情報を取得している必要がある
  return user;
}       