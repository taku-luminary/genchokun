import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";                            
import { redirect } from "next/navigation";
                                                                                       
export async function POST(request: Request) {
  const { email, password } = await request.json();                                    
                                 
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
                                                                                       
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });               
  }                              

  redirect("/");
}