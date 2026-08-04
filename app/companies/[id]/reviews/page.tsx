"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { StarRating } from "@/app/_components/ui/StarRating";
import { CompanyReviewCard } from "@/app/_components/CompanyReviewCard";
import type { CompanyReviewsResponse } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";

export default function CompanyReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, mutate } =
    useAuthedFetch<CompanyReviewsResponse>(`/api/companies/${id}/reviews`);

  // 表示中のロール（タブ）。初期は左側の「販売店として」。
  const [role, setRole] = useState<ReviewRole>("sales");

  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data)
    return <p className="text-center text-red-500 py-20">レビューの取得に失敗しました</p>;

  const current = data[role]; // { count, reviews }

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Link href={`/companies/${id}`} className="inline-block text-sm text-brand-green underline">
          ← 企業ページに戻る
        </Link>

        {/* 見出し＋総合評価（工事店/販売店の合算） */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-2">
          <h1 className="text-lg font-bold text-slate-800 break-words">
            {data.companyName} の評価
          </h1>
          {data.overall ? (
            <StarRating rating={data.overall.average} count={data.overall.count} size="lg" />
          ) : (
            <p className="text-sm text-slate-400">まだ評価はありません</p>
          )}
        </div>

        {/* ロールタブ（販売店として＝左 / 工事店として＝右） */}
        <div className="flex gap-2">
          <TabButton
            active={role === "sales"}
            onClick={() => setRole("sales")}
            label="販売店として"
            count={data.sales.count}
          />
          <TabButton
            active={role === "contractor"}
            onClick={() => setRole("contractor")}
            label="工事店として"
            count={data.contractor.count}
          />
        </div>

        {/* 一覧 */}
        {current.reviews.length === 0 ? (
          <p className="text-center text-slate-500 py-10">この役割の評価はまだありません</p>
        ) : (
          <ul className="space-y-3">
            {current.reviews.map((r) => (
              <CompanyReviewCard key={r.id} review={r} onChanged={() => mutate()} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// タブ1つ分（押している方を緑で強調）
function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 rounded-2xl text-sm font-bold transition ${
        active
          ? "bg-brand-green text-white shadow"
          : "bg-white text-slate-600 border border-slate-200"
      }`}
    >
      {label}（{count}件）
    </button>
  );
}
