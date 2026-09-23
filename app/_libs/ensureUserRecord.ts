import { prisma } from "@/app/_libs/prisma";
import type { User } from "@supabase/supabase-js";

// Supabase Auth のユーザーに対応する users テーブルの行を保証する共通関数。
// 行が無ければ作成し、あればメールアドレスを Supabase Auth の今の値にそろえる（upsert）。
// メール確認リンクを別端末で開いた場合など、callback で users 行が
// 作られないケースがあるため、callback とログインの両方から呼ぶ。
// メールアドレスをそろえるのは、ログイン用メールアドレスを変更しても
// users.email（管理ダッシュボードに表示）が古いままにならないようにするため。
// なお Supabase 本番DBには auth.users への INSERT 時に public.users へ
// 自動転記するトリガーも設定済み（docs/sql/create_users_trigger.sql 参照）。
// トリガーが動くのは行が作られたときだけで、メールアドレスの変更は反映されないため、ここでそろえる
export async function ensureUserRecord(user: User) {
  await prisma.users.upsert({
    where: { id: user.id },
    update: { email: user.email ?? null },
    create: {
      id: user.id,
      email: user.email ?? null,
      isActive: true,
      isAdmin: false,
    },
  });
}
