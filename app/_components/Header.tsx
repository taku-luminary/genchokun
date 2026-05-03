  import React from "react";
  import { createClient } from "@/app/_libs/supabase/server";
  import { LogoutButton } from "./LogoutButton";

  export const Header = async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#34b38a"/>
                <path d="M12 20L18 26L28 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10L30 30" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
              </svg>
              <div className="ml-2">
                <h1 className="text-xl font-bold text-brand-green leading-tight">現調くん</h1>
                <p className="text-[10px] text-slate-400 font-medium">調査・工事のマッチングサービス</p>
              </div>
            </a>
          </div>

          <nav className="flex items-center gap-4 md:gap-8">
          {user ? (
            <>
              <span className="text-sm text-slate-500 hidden md:block">{user.email}</span>
              <a
                href="/mypage"
                className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors"
              >
                マイページ
              </a>
              <LogoutButton />
            </>
          ) : (
              <>
                <a href="/signup" className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors">会員登録</a>
                <a href="/login" className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors">ログイン</a>
              </>
            )}
          </nav>
        </div>
      </header>
    );
  };
