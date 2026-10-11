"use server";

import { createClient } from "@/app/_libs/supabase/server";

// ログアウトする。Supabase 側でのログアウトに失敗したときは、ログインの Cookie が消されずに残るので、
// ok: false を返して画面側でやり直せるようにする
export async function logout(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { ok: !error };
}
