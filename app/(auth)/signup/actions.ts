"use server";
                                                                                                           
import { createClient } from "@/app/_libs/supabase/server";                                              
 
export async function signup(formData: FormData) {                                                       
  const supabase = await createClient();
                                                                                                         
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;                                     
                                 
  if (password !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }                                                                                                      
 
  const { error } = await supabase.auth.signUp({                                                         
    email: formData.get("email") as string,
    password,
    options: {
      emailRedirectTo: "http://localhost:3000/auth/callback",
    },                                                                                                   
  });
                                                                                                         
  if (error) {                   
    return { error: error.message };
  }

  return { success: true };
}