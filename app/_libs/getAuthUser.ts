import { createClient } from
"@/app/_libs/supabase/server";                            
 
// ログイン中のユーザーを返す共通関数                     
// 未ログインの場合は null を返す
export async function getAuthUser() {                     
  const supabase = await createClient();
  const { data: { user } } = await                        
  supabase.auth.getUser();                                  
  return user;
}       