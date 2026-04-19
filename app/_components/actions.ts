"use server";

import { createClient } from "@/app/_libs/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}