"use client";

import { useForm, useWatch, Controller, type Control } from "react-hook-form";
import { REVIEW_ITEM_LABELS, OVERALL_LABEL } from "@/app/_constants/reviewItems";
import { StarRating } from "@/app/_components/ui/StarRating";
import type { ReviewInput } from "@/app/_types/reviews";
import type { ReviewRole } from "@/app/_libs/companyRatings";

type Props = {
  targetRole: ReviewRole;
  initialValues?: ReviewInput;
  submitLabel?: string;
  onSubmit: (input: ReviewInput) => void | Promise<void>;
};

// item1Rating〜item5Rating のフィールド名（配列の順＝項目ラベルの順）
const ITEM_NAMES = [
  "item1Rating",
  "item2Rating",
  "item3Rating",
  "item4Rating",
  "item5Rating",
] as const;

// 1〜5をクリックで選ぶ入力用の星
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
          className={`px-1 py-2 text-2xl leading-none ${
            n <= value ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// 総合評価（5項目の平均）だけを監視して表示する小さな部品。
// useWatch でこの部分だけ再描画し、フォーム全体の再レンダリングを避ける。
function OverallAverage({ control }: { control: Control<ReviewInput> }) {
  const values = useWatch({ control, name: ITEM_NAMES });
  const nums = values.map((v) => v ?? 0);
  const allSelected = nums.every((v) => v >= 1);
  const average = allSelected ? nums.reduce((s, v) => s + v, 0) / 5 : null;

  return average !== null ? (
    <StarRating rating={average} />
  ) : (
    <span className="text-xs text-slate-400 -ml-3">5項目を選ぶと計算されます</span>
  );
}

export function ReviewForm({
  targetRole,
  initialValues,
  submitLabel = "この内容で投稿する",
  onSubmit,
}: Props) {
  const labels = REVIEW_ITEM_LABELS[targetRole];

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ReviewInput>({
    defaultValues: {
      item1Rating: initialValues?.item1Rating ?? 0,
      item2Rating: initialValues?.item2Rating ?? 0,
      item3Rating: initialValues?.item3Rating ?? 0,
      item4Rating: initialValues?.item4Rating ?? 0,
      item5Rating: initialValues?.item5Rating ?? 0,
    },
  });

  const submit = async (data: ReviewInput) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-2">
      {/* 総合評価：5項目の平均を自動計算（ユーザーは入力しない） */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <span className="text-sm font-bold text-slate-800">
          {OVERALL_LABEL}（自動計算）
        </span>
        <OverallAverage control={control} />
      </div>

      {/* 項目別（5項目）。自作の星は register で繋げないので Controller を使う */}
      {labels.map((label, i) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <Controller
            control={control}
            name={ITEM_NAMES[i]}
            rules={{ min: { value: 1, message: "すべての項目を選択してください" } }}
            render={({ field }) => (
              <StarPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      ))}

      {/* 未選択があると送信時にエラーが入る。まとめて1つだけ表示 */}
      {Object.keys(errors).length > 0 && (
        <p className="text-red-500 text-sm">すべての項目を選択してください</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-2xl bg-brand-green text-white font-black text-base shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {isSubmitting ? "送信中..." : submitLabel}
      </button>
    </form>
  );
}
