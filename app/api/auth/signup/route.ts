import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = await createClient();
  const siteUrl = process.env.SITE_URL;

  if (!siteUrl) {
    return NextResponse.json(
      { error: "SITE_URL が設定されていません" },
      { status: 500 }
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}