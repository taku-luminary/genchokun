"use client";

import { useState } from "react";
import { REVIEW_ITEM_LABELS, OVERALL_LABEL } from "@/app/_constants/reviewItems";
import { StarRating } from "@/app/_components/ui/StarRating";
import type { ReviewInput } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";

type Props = {
  targetRole: ReviewRole;
  initialValues?: ReviewInput;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (input: ReviewInput) => void;
};

// 1〜5をクリックで選ぶ入力用の星
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex flex-shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}点`}
          className={`px-0.5 py-1.5 text-3xl leading-none ${
            n <= value ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function ReviewForm({
  targetRole,
  initialValues,
  submitLabel = "この内容で投稿する",
  submitting = false,
  onSubmit,
}: Props) {
  const labels = REVIEW_ITEM_LABELS[targetRole];

  const [items, setItems] = useState<number[]>(
    initialValues
      ? [
          initialValues.item1Rating,
          initialValues.item2Rating,
          initialValues.item3Rating,
          initialValues.item4Rating,
          initialValues.item5Rating,
        ]
      : [0, 0, 0, 0, 0],
  );
  const [error, setError] = useState<string | null>(null);

  const setItem = (index: number, v: number) => {
    setItems((prev) => prev.map((cur, i) => (i === index ? v : cur)));
  };

  const allSelected = items.every((v) => v >= 1);
  // 総合評価は5項目の平均（自動計算・入力不可）
  const average = allSelected ? items.reduce((s, v) => s + v, 0) / 5 : null;

  const handleSubmit = () => {
    if (!allSelected) {
      setError("すべての項目を選択してください");
      return;
    }
    setError(null);
    onSubmit({
      item1Rating: items[0],
      item2Rating: items[1],
      item3Rating: items[2],
      item4Rating: items[3],
      item5Rating: items[4],
    });
  };

  return (
    <div className="space-y-2">
      {/* 総合評価：5項目の平均を自動計算（ユーザーは入力しない） */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <span className="text-sm font-bold text-slate-800">
          {OVERALL_LABEL}（自動計算）
        </span>
        {average !== null ? (
          <StarRating rating={average} />
        ) : (
          <span className="text-xs text-slate-400">5項目を選ぶと計算されます</span>
        )}
      </div>

      {/* 項目別（5項目） */}
      {labels.map((label, i) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <StarPicker value={items[i]} onChange={(v) => setItem(i, v)} />
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-2xl bg-brand-green text-white font-black text-base shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {submitting ? "送信中..." : submitLabel}
      </button>
    </div>
  );
}
