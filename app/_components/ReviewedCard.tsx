"use client";

import { useState } from "react";
import { ReviewForm } from "@/app/_components/ReviewForm";
import type { ReviewInput } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";

type Props = {
  reviewId: string; // 編集・削除の宛先
  targetRole: ReviewRole; // 編集フォームの項目セット
  initialValues: ReviewInput; // 投稿済みの点数（編集の初期値）
  onChanged: () => void; // 編集/削除成功後に親へ通知（親が再取得）
};

export function ReviewedCard({
  reviewId,
  targetRole,
  initialValues,
  onChanged,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async (input: ReviewInput) => {
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
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


  const handleDelete = async () => {
    if (!window.confirm("この評価を削除します。よろしいですか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
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

  // 編集モード：フォームを開いて上書き更新 or 削除
  if (editing) {
    return (
      <section className="bg-brand-bg border-2 border-brand-green/30 rounded-2xl p-6 space-y-3">
        <p className="text-base font-bold text-brand-green">評価を編集する</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <ReviewForm
          targetRole={targetRole}
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
            className="text-sm text-slate-500 underline"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 underline disabled:opacity-50"
          >
            {deleting ? "削除中..." : "この評価を削除"}
          </button>
        </div>
      </section>
    );
  }

  // 通常（投稿済み）：控えめなカード
  return (
    <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
      <p className="text-sm font-bold text-slate-600">✓ 評価を投稿しました</p>
      <p className="text-xs text-slate-500">
        ご協力ありがとうございました。相手企業の企業ページにあなたの評価が公開されています。
      </p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-bold text-brand-green underline pt-1"
      >
        投稿した内容を見る・編集する ›
      </button>
    </section>
  );
}
