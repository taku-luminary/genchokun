import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#34b38a"/>
              <path d="M12 20L18 26L28 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 10L30 30" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
            </svg>
            <div className="ml-2">
              <h1 className="text-xl font-bold text-brand-green leading-tight">現調くん</h1>
              <p className="text-[10px] text-slate-400 font-medium">調査・工事のマッチングサービス</p>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors">会員登録</a>
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors">ログイン</a>
        </nav>
      </div>
    </header>
  );
};
