import { createClient } from "@/app/_libs/supabase/server";
import { prisma } from "@/app/_libs/prisma";

// ログイン中で、かつサービスを使える会員を返す共通関数。
// 次のどれかに当たるときは null を返し、呼び出し側（会員向けの API）は「ログインが必要です」として断る
// - 未ログイン
// - users の行が無い（ログイン・確認メールの処理で ensureUserRecord が作るまでは、会員の機能を使わせない）
// - 運営が利用を停止している（users.isActive が false。退会もこの扱い）
// ログイン・確認メール・callback の処理はこの関数を通らないので、行が無い人を止めても初期登録は進められる
export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
    // SupabaseがCookieを見てトークンをもとに「この人はログイン済みか」を確認をして、supabaseのユーザー情報を返す） ※ 事前にcreateClientでcookieの情報を取得している必要がある
  if (!user) return null;

  const member = await prisma.users.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });
  if (!member || !member.isActive) return null;

  return user;
}
