import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserRecord } from "@/app/_libs/ensureUserRecord";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 確認メールを別端末で開いた等で callback の upsert が実行されなかった
  // ユーザーのため、ログイン成功時にも users 行を保証する
  if (data.user) {
    await ensureUserRecord(data.user);
  }

  redirect("/");
}
