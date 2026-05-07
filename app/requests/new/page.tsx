"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PREFECTURES } from "@/app/_constants/prefectures";
import type { CreateRequestRequest } from "@/app/_types/requests";

export default function NewRequestPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestRequest>();

  const createRequest = async (data: CreateRequestRequest) => {
    setServerError(null);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error ?? "投稿に失敗しました");
      return;
    }
    router.push("/mypage"); // 投稿成功 → マイページへ
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">現調に行ける日の投稿フォーム</h1>

      <form onSubmit={handleSubmit(createRequest)} className="space-y-5">

        {/* 都道府県 */}
        <div>
          <Label htmlFor="prefectureId">都道府県 *</Label>
          <select
            id="prefectureId"
            disabled={isSubmitting}
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            {...register("prefectureId", { required: "都道府県を選択してください", valueAsNumber: true })}
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.prefectureId && (
            <p className="text-red-500 text-xs mt-1">{errors.prefectureId.message}</p>
          )}
        </div>

        {/* 市区町村 */}
        <div>
          <Label htmlFor="city">市区町村</Label>
          <Input id="city" disabled={isSubmitting} placeholder="例：文京区" {...register("city")} />
        </div>

        {/* タイトル */}
        <div>
          <Label htmlFor="title">タイトル *</Label>
          <Input
            id="title"
            disabled={isSubmitting}
            placeholder="例：太陽光パネルの現地調査に対応できます"
            {...register("title", { required: "タイトルを入力してください" })}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* 調査可能内容 */}
        <div>
          <Label htmlFor="investigationSummary">調査可能内容</Label>
          <textarea
            id="investigationSummary"
            disabled={isSubmitting}
            placeholder="例：太陽光パネル・蓄電池・エコキュート"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={2}
            {...register("investigationSummary")}
          />
        </div>

        {/* 調査詳細 */}
        <div>
          <Label htmlFor="investigationDetails">調査詳細</Label>
          <textarea
            id="investigationDetails"
            disabled={isSubmitting}
            placeholder="対応可能な内容の詳細を記載してください"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={3}
            {...register("investigationDetails")}
          />
        </div>

        {/* 対応可能日程 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="availableStartDate">対応可能開始日</Label>
            <Input id="availableStartDate"  disabled={isSubmitting} type="date" {...register("availableStartDate")} />
          </div>
          <div className="flex-1">
            <Label htmlFor="availableEndDate">対応可能終了日</Label>
            <Input id="availableEndDate" disabled={isSubmitting} type="date" {...register("availableEndDate")} />
          </div>
        </div>

        {/* 最低報酬 */}
        <div>
          <Label htmlFor="rewardMinYen">最低報酬（円）</Label>
          <Input
            id="rewardMinYen"
            disabled={isSubmitting}
            type="number"
            placeholder="例：15000"
            {...register("rewardMinYen", { valueAsNumber: true })}
          />
        </div>

        {/* 支払サイクル */}
        <div>
          <Label htmlFor="paymentCycle">支払サイクル</Label>
          <Input
            id="paymentCycle"
            disabled={isSubmitting}
            placeholder="例：人日発注"
            {...register("paymentCycle")}
          />
        </div>

        {/* サーバーエラー */}
        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
        )}

        {/* 送信ボタン */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "依頼待ちを掲載する"}
        </Button>
      </form>
    </div>
  );
}