"use client";

import { useState } from "react";
import { REVIEW_ITEM_LABELS, OVERALL_LABEL } from "@/app/_constants/reviewItems";
import type { ReviewInput } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";

type Props = {
  targetRole: ReviewRole; // 表示する項目セット（工事店用/販売店用）
  initialValues?: ReviewInput; // 編集時の初期値。無ければ新規（未選択）
  submitLabel?: string; // ボタン文言
  submitting?: boolean; // 送信中フラグ（親が管理）
  onSubmit: (input: ReviewInput) => void; // 確定した点数を親に渡す
};

// 1〜5をクリックで選ぶ入力用の星（塗り/未塗りの2値）
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
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

  const [overall, setOverall] = useState(initialValues?.overallRating ?? 0);
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

  const allSelected = overall >= 1 && items.every((v) => v >= 1);

  const handleSubmit = () => {
    if (!allSelected) {
      setError("すべての項目を選択してください");
      return;
    }
    setError(null);
    onSubmit({
      overallRating: overall,
      item1Rating: items[0],
      item2Rating: items[1],
      item3Rating: items[2],
      item4Rating: items[3],
      item5Rating: items[4],
    });
  };

  return (
    <div className="space-y-2">
      {/* 総合評価 */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <span className="text-sm font-bold text-slate-800">{OVERALL_LABEL}</span>
        <StarPicker value={overall} onChange={setOverall} />
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
