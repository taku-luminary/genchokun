import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#34b38a"/>
            <path d="M12 20L18 26L28 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            {/* サービス名はブランドの見え方を優先し、文字用の brand-green-dark ではなく brand-green のままにする */}
            <h2 className="text-lg font-bold text-brand-green leading-tight">電工くん</h2>
            <p className="text-[10px] text-slate-400 font-medium">電気工事・調査のマッチングサービス</p>
          </div>
        </div>

        {/* 規約・ポリシー・問い合わせ窓口は未ログインでも読めなければならないため、
            全ページ共通のフッターから常に辿れるようにしている。
            各リンクに py-3 を持たせているのは、タップ対象の高さを確保するため */}
        <nav className="flex flex-col md:flex-row md:flex-wrap md:gap-8 text-xs text-slate-500">
          <Link href="/contact" className="py-3 hover:text-brand-green-dark transition-colors">
            お問い合わせ・報告
          </Link>
          <Link href="/terms" className="py-3 hover:text-brand-green-dark transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="py-3 hover:text-brand-green-dark transition-colors">
            プライバシーポリシー
          </Link>
          {/* 運営者情報は /contact 内のセクションなので、アンカーで直接飛ばす */}
          <Link href="/contact#operator" className="py-3 hover:text-brand-green-dark transition-colors">
            運営会社
          </Link>
        </nav>
      </div>
    </footer>
  );
};
