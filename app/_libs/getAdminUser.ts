import { getAuthUser } from "./getAuthUser";
import { prisma } from "./prisma";

// 管理者(isAdmin=true)のユーザーだけを返す共通関数。
// 未ログイン・非管理者の場合は null を返す。
// 記事の作成/編集など「管理者だけが行う操作」の入口で使う。
export async function getAdminUser() {
  // まず通常のログイン確認（未ログインなら null）
  const user = await getAuthUser();
  if (!user) return null;

  // users テーブルで isAdmin を確認する
  // （getAuthUser が返すのは Supabase 側のユーザー情報なので、
  //   アプリDBの isAdmin はここで引き直す必要がある）
  const dbUser = await prisma.users.findUnique({
    where: { id: user.id },
    select: { id: true, isAdmin: true },
  });

  // 該当ユーザーがいない or 管理者でないなら通さない
  if (!dbUser || !dbUser.isAdmin) return null;

  // 呼び出し側で createdBy / updatedBy に使えるよう id を含めて返す
  return dbUser; // { id, isAdmin }
}
