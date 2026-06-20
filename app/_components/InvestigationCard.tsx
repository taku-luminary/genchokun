import type { ReactNode } from "react";

type Props = {
  summary: string | null;
  details: string | null;
  // 応募ボタン等。ページごとに異なるのでここに差し込む（無くてもよい）
  children?: ReactNode;
};

export function InvestigationCard({ summary, details, children }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border-2 border-brand-green">
      <div className="p-6 space-y-4">
        <p className="font-bold text-slate-700">調査内容</p>

        {summary ? (
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">概要</p>
            <p className="text-slate-700">{summary}</p>
          </div>
        ) : (
          <p className="text-slate-400">概要の記載なし</p>
        )}

        {details && (
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">詳細</p>
            <p className="text-slate-700 whitespace-pre-wrap">{details}</p>
          </div>
        )}
      </div>

      {/* 応募ボタン等（ページ側から渡す。mypage では渡さない） */}
      {children}
    </div>
  );
}
