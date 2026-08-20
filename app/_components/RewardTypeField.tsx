"use client";

import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import type { CreateProjectRequest } from "@/app/_types/projects";

type Props = {
  control: Control<CreateProjectRequest>;
  register: UseFormRegister<CreateProjectRequest>;
  errors: FieldErrors<CreateProjectRequest>;
  disabled?: boolean;
};

// 案件の報酬欄。「金額を指定」か「見積もり希望」かを選び、
// 金額指定のときだけ金額入力を表示する。新規/編集フォームで共有する。
export function RewardTypeField({ control, register, errors, disabled }: Props) {
  // 現在の選択値を監視して、金額入力の表示/非表示を切り替える
  const rewardType = useWatch({ control, name: "rewardType" });

  return (
    <div className="space-y-2">
      <Label>報酬</Label>

      {/* 決め方の選択（スマホでも押しやすいよう縦積み） */}
      <Controller
        name="rewardType"
        control={control}
        rules={{ required: "報酬の決め方を選択してください" }}
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 py-2">
              <input
                type="radio"
                value="fixed"
                checked={field.value === "fixed"}
                onChange={() => field.onChange("fixed")}
                disabled={disabled}
              />
              <span>金額を指定する</span>
            </label>
            <label className="flex items-center gap-2 py-2">
              <input
                type="radio"
                value="negotiable"
                checked={field.value === "negotiable"}
                onChange={() => field.onChange("negotiable")}
                disabled={disabled}
              />
              <span>見積もり希望（応募者と相談して決める）</span>
            </label>
          </div>
        )}
      />

      {/* 金額指定のときだけ入力欄を出す */}
      {rewardType === "fixed" ? (
        <div>
          <Label htmlFor="rewardYen">報酬（円）</Label>
          <Input
            id="rewardYen"
            type="number"
            disabled={disabled}
            placeholder="例：15000"
            {...register("rewardYen", {
              valueAsNumber: true,
              // 見積もり希望に切り替えて入力欄が消えたら、値と検証を破棄する。
              // これがないと「隠れているのに必須エラーで送信できない」状態になる。
              shouldUnregister: true,
              required: "報酬額を入力してください",
              min: { value: 1, message: "1円以上を入力してください" },
            })}
          />
          {errors.rewardYen && (
            <p className="text-red-500 text-xs mt-1">{errors.rewardYen.message}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          金額は空欄のまま投稿できます。応募者と相談して金額を決めます。
        </p>
      )}
    </div>
  );
}
