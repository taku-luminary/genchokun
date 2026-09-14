import type { ReactNode } from "react";
import { CardHeader } from "@/app/_components/ui/CardHeader";

type Props = {
  // カード全体の見出し（例: "案件詳細"）。下線つきで表示する。省略すると見出しを出さない
  title?: string;
  // summary のラベル。見出しだけで何の内容か分かるページでは省略できる
  summaryLabel?: string;
  summary: string | null;
  noteLabel?: string;
  note: string | null;
  // 応募ボタン等。ページごとに異なるのでここに差し込む（無くてもよい）
  children?: ReactNode;
};

export function ContentCard({ title, summaryLabel, summary, noteLabel = "メモ・備考", note, children }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <div className="p-6 space-y-4">
        {title && <CardHeader title={title} />}

        <div>
          {summaryLabel && (
            <p className="text-mm font-bold text-slate-700 mb-1">{summaryLabel}</p>
          )}
          {/* ラベルがあるときは本文をラベルより1文字分右から始め、どこからが内容か分かりやすくする */}
          <div className={summaryLabel ? "pl-4" : undefined}>
            {summary ? (
              <p className="text-slate-700 whitespace-pre-wrap">{summary}</p>
            ) : (
              <p className="text-slate-400">記載なし</p>
            )}
          </div>
        </div>

        {note && (
          <div>
            <p className="text-mm font-bold text-slate-700 mb-1">{noteLabel}</p>
            <p className="pl-4 text-slate-700 whitespace-pre-wrap">{note}</p>
          </div>
        )}
      </div>

      {/* 応募ボタン等（ページ側から渡す。mypage では渡さない） */}
      {children}
    </div>
  );
}
