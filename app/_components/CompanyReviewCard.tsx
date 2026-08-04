"use client";

import { useState } from "react";
import Link from "next/link";
import { ReviewForm } from "@/app/_components/ReviewForm";
import { StarRating } from "@/app/_components/ui/StarRating";
import { REVIEW_ITEM_LABELS } from "@/app/_constants/reviewItems";
import type { ReviewInput, CompanyReviewItem } from "@/app/_types/reviews";

type Props = {
  review: CompanyReviewItem;
  onChanged: () => void; // 編集/削除の成功後に親へ通知（親が再取得する）
};

export function CompanyReviewCard({ review, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialValues: ReviewInput = {
    item1Rating: review.item1Rating,
    item2Rating: review.item2Rating,
    item3Rating: review.item3Rating,
    item4Rating: review.item4Rating,
    item5Rating: review.item5Rating,
  };

  // 更新（PUT /api/reviews/[id]）
  const handleEdit = async (input: ReviewInput) => {
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("error" in json ? json.error : "更新に失敗しました");
        return;
      }
      setEditing(false);
      onChanged();
    } catch {
      setError("通信エラーが発生しました");
    }
  };

  // 削除（DELETE /api/reviews/[id]）
  const handleDelete = async () => {
    if (!window.confirm("この評価を削除します。よろしいですか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("error" in json ? json.error : "削除に失敗しました");
        return;
      }
      onChanged();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  // 編集モード：フォームを開いて上書き更新／削除
  if (editing) {
    return (
      <li className="bg-brand-bg border-2 border-brand-green/30 rounded-2xl p-4 md:p-6 space-y-3">
        <p className="text-base font-bold text-brand-green">評価を編集する</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <ReviewForm
          targetRole={review.targetRole}
          initialValues={initialValues}
          submitLabel="この内容で更新する"
          onSubmit={handleEdit}
        />
        <div className="flex justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="text-sm text-slate-500 underline py-2"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 underline disabled:opacity-50 py-2"
          >
            {deleting ? "削除中..." : "この評価を削除"}
          </button>
        </div>
      </li>
    );
  }

  // 通常表示：案件要約（日程・金額なし）＋総合評価＋5項目
  const post = review.relatedPost;
  const items = REVIEW_ITEM_LABELS[review.targetRole];
  const itemValues = [
    review.item1Rating,
    review.item2Rating,
    review.item3Rating,
    review.item4Rating,
    review.item5Rating,
  ];

  return (
    <li className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-3">
      {/* 案件/依頼の要約（日程・金額は表示しない） */}
      {post ? (
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-medium text-slate-400">{post.date}</p>
          <div className="flex items-center text-sm text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span className="break-words">{post.location}</span>
          </div>
          <Link
            href={`/${post.kind === "project" ? "projects" : "requests"}/${post.id}`}
            className="block text-lg md:text-xl font-bold text-brand-green underline hover:opacity-80 transition break-words"
          >
            {post.title}
          </Link>
        </div>
      ) : (
        <p className="text-base font-bold text-slate-800">（案件情報なし）</p>
      )}

      {/* 評価 */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        {/* 総合評価（左）と投稿企業名・日付（右）を同じ行に */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">総合評価</span>
            <StarRating rating={review.overall} size="md" />
          </div>
          <p className="text-xs text-slate-400 text-right leading-relaxed flex-shrink-0">
            {review.reviewerCompanyName}
            <br />
            {new Date(review.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>

        {/* 項目別（5項目）。PCは2列に並べて縦長を抑える */}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
          {items.map((label, i) => (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{label}</span>
              <StarRating rating={itemValues[i]} size="sm" />
            </li>
          ))}
        </ul>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 自分の投稿だけ編集/削除 */}
        {review.isMine && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-brand-green underline py-2"
            >
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-600 underline disabled:opacity-50 py-2"
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
