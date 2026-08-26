import type { ReactNode } from "react";

type Props = {
  // summary のラベルは案件（案件内容）と依頼待ち（受注できる内容）で異なるため、ページ側から渡す
  summaryLabel: string;
  summary: string | null;
  noteLabel?: string;
  note: string | null;
  // 応募ボタン等。ページごとに異なるのでここに差し込む（無くてもよい）
  children?: ReactNode;
};

export function ContentCard({ summaryLabel, summary, noteLabel = "メモ・備考", note, children }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="p-6 space-y-4">
        <div>
          <p className="text-mm font-bold text-slate-700 mb-1">{summaryLabel}</p>
          {summary ? (
            <p className="text-slate-700 whitespace-pre-wrap">{summary}</p>
          ) : (
            <p className="text-slate-400">記載なし</p>
          )}
        </div>

        {note && (
          <div>
            <p className="text-mm font-bold text-slate-700 mb-1">{noteLabel}</p>
            <p className="text-slate-700 whitespace-pre-wrap">{note}</p>
          </div>
        )}
      </div>

      {/* 応募ボタン等（ページ側から渡す。mypage では渡さない） */}
      {children}
    </div>
  );
}
