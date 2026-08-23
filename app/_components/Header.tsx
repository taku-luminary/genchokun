import React from "react";
import { createClient } from "@/app/_libs/supabase/server";
import { prisma } from "@/app/_libs/prisma";          // ← 追加
import { LogoutButton } from "./LogoutButton";
import { MypageNoticeDot } from "./MypageNoticeDot";
import Link from "next/link";

export const Header = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ログイン中なら自社の企業IDを取得（未登録なら null）
  let companyId: string | null = null;
  if (user) {
    const company = await prisma.companies.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    companyId = company ? company.id.toString() : null;
  }
  // 企業ページがあればそこへ、なければ登録（編集）ページへ
  const companyHref = companyId ? `/companies/${companyId}` : "/mypage/settings/company";
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#34b38a"/>
                <path d="M12 20L18 26L28 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10L30 30" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
              </svg>
              <div className="ml-2">
                <h1 className="text-xl font-bold text-brand-green leading-tight">電工くん</h1>
                <p className="hidden md:block text-[10px] text-slate-400 font-medium">電気工事・調査のマッチングサービス</p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-3 md:gap-8">
          {user ? (
            <>
              <span className="text-sm text-slate-500 hidden md:block">{user.email}</span>
              <Link
                href="/mypage"
                className="relative text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green transition-colors whitespace-nowrap"
              >
                マイページ
                <MypageNoticeDot />
              </Link>
              <Link href={companyHref} className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green transition-colors whitespace-nowrap"
              >
                自社情報
              </Link>
              <LogoutButton />
            </>
          ) : (
              <>
                <Link href="/signup" className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green transition-colors whitespace-nowrap"
                >会員登録</Link>
                <Link href="/login" className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green transition-colors whitespace-nowrap"
                >ログイン</Link>
              </>
            )}
          </nav>
        </div>
      </header>
    );
  };
