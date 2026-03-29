import React from 'react';

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
            <h2 className="text-lg font-bold text-brand-green leading-tight">現調くん</h2>
            <p className="text-[8px] text-slate-400 font-medium">調査・工事のマッチングサービス</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-xs text-slate-500">
          <a href="#" className="hover:text-brand-green transition-colors">お問い合わせ・報告</a>
          <a href="#" className="hover:text-brand-green transition-colors">利用規約</a>
          <a href="#" className="hover:text-brand-green transition-colors">運営会社</a>
        </div>
      </div>
    </footer>
  );
};
