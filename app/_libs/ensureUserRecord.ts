import { prisma } from "@/app/_libs/prisma";
import type { User } from "@supabase/supabase-js";

// Supabase Auth のユーザーに対応する users テーブルの行を保証する共通関数
// 存在しなければ作成、存在すればそのまま通す（upsert）
// メール確認リンクを別端末で開いた場合など、callback で users 行が
// 作られないケースがあるため、callback とログインの両方から呼ぶ
export async function ensureUserRecord(user: User) {
  await prisma.users.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? null,
      isActive: true,
      isAdmin: false,
    },
  });
}
