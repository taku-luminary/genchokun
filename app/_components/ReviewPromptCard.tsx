"use client";

import { useState } from "react";
import { ReviewForm } from "@/app/_components/ReviewForm";
import { ContactInfo } from "@/app/_components/ContactInfo";
import type { ReviewInput } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";
import type { CompanyContact } from "@/app/_types/companies";

type Props = {
  matchId: string; // レビューの投稿先
  targetRole: ReviewRole; // 表示する項目セット
  partnerName: string | null; // 相手企業名（見出し用）
  contactLabel: string; // 例: "工事店の連絡先"
  contact: CompanyContact | null; // 折りたたみで見せる連絡先
  onReviewed: () => void; // 投稿成功後に親へ通知（親が再取得 → 状態③へ）
};

export function ReviewPromptCard({
  matchId,
  targetRole,
  partnerName,
  contactLabel,
  contact,
  onReviewed,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (input: ReviewInput) => {
    setServerError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError("error" in json ? json.error : "投稿に失敗しました");
        return;
      }
      onReviewed();
    } catch {
      setServerError("通信エラーが発生しました");
    }
  };


  return (
    <section className="bg-brand-bg border-2 border-brand-green/30 rounded-2xl p-6 space-y-3">
      <p className="text-lg md:text-2xl font-bold text-brand-green">
        🔔 現地調査は完了しましたか？
      </p>
      <p className="text-slate-700 font-medium">
        完了していましたら、
        <span className="font-bold">{partnerName ?? "相手企業"}</span>
        様を評価してください。投稿すると、あなたの評価が相手企業の企業ページに公開されます。
      </p>

      <div className="border-t border-brand-green/30 pt-3 mt-3 space-y-3">
        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

        <ReviewForm targetRole={targetRole} onSubmit={handleSubmit} />


        {/* 連絡先は折りたたみで残す（まだ連絡したいとき開ける） */}
        <details className="pt-1">
          <summary className="cursor-pointer text-sm font-bold text-brand-green">
            {contactLabel}をもう一度見る
          </summary>
          <div className="mt-3">
            <ContactInfo
              phone={contact?.phone ?? null}
              email={contact?.email ?? null}
              lineId={contact?.lineId ?? null}
              note={contact?.note ?? null}
            />
          </div>
        </details>
      </div>
    </section>
  );
}
