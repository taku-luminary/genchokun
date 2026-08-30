"use client";

import { PrefectureMultiSelect } from "@/app/_components/ui/PrefectureMultiSelect";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import type { CreateRequestRequest } from "@/app/_types/requests";
import { RequestRewardTypeField } from "@/app/_components/RequestRewardTypeField";
import { autoGrowTextarea } from "@/app/_utils/autoGrow";
import { useCompany } from "@/app/_hooks/useCompany";
import { CompanyRequiredNotice } from "@/app/_components/ui/CompanyRequiredNotice";

export default function NewRequestPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control, 
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestRequest>({ defaultValues: { rewardType: "fixed" } });
  const { isRegistered, isLoading: isCompanyLoading } = useCompany();
  const createRequest = async (data: CreateRequestRequest) => {
    clearErrors('root.serverError');

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // エラー応答が JSON でない場合に備え、json() 失敗時は空オブジェクト扱いにする
        const json = await res.json().catch(() => ({}));
        setError('root.serverError', {
          type: 'server',
          message: json.error ?? "投稿に失敗しました",
        });
        return;
      }
      router.push("/mypage");
    } catch {
      // fetch 自体の失敗（オフライン・通信断など）をここで拾う
      setError('root.serverError', {
        type: 'server',
        message: "通信エラーが発生しました。時間をおいて再度お試しください。",
      });
    }
  };

  if (isCompanyLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  if (!isRegistered) {
    return <CompanyRequiredNotice />;
  }  

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">受注可能な情報の投稿フォーム
      </h1>

      <form onSubmit={handleSubmit(createRequest)} className="space-y-5">

        {/* 対応可能エリア（複数選択） */}
        <div>
          <Label htmlFor="prefectureIds">対応可能エリア *（複数選択可）</Label>
          {/* 自作部品は register で接続できないため Controller を使う
              （詳しい説明は projects/new・projects/[id]/edit の同じ箇所のコメント参照）
              注意: rules の required は「空配列 []」を通してしまう（[] は undefined ではないため）。
              配列の必須チェックは validate で「1件以上あるか」を自分で判定する */}
          <Controller
            name="prefectureIds"
            control={control}
            rules={{
              validate: (v) => (v && v.length > 0) || "都道府県を1つ以上選択してください",
            }}
            render={({ field }) => (
              <PrefectureMultiSelect
                id="prefectureIds"
                value={field.value ?? []}  // 初期値（undefined）は空配列に変換して渡す
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.prefectureIds && (
            <p className="text-red-500 text-xs mt-1">{errors.prefectureIds.message}</p>
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
            placeholder="例：太陽光パネル・蓄電池の工事や現地調査はお任せください！"
            {...register("title", { required: "タイトルを入力してください" })}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* 受注できる内容 */}
        <div>
          <Label htmlFor="summary">受注できる内容</Label>
          <textarea
            id="summary"
            disabled={isSubmitting}
            placeholder="例：太陽光パネル・蓄電池・エコキュート・防水・足場・高圧"
            className="w-full min-h-32 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none overflow-hidden"
            rows={2}
            {...register("summary")}
            onInput={autoGrowTextarea}
          />
        </div>

        {/* メモ・備考 */}
        <div>
          <Label htmlFor="note">メモ・備考</Label>
          <textarea
            id="note"
            disabled={isSubmitting}
            placeholder="例：現地調査は土日以外でしたら基本対応可能です。架台や商材の選定のご相談も承ります。工事後の電力申請も対応可能です。"
            className="w-full min-h-24 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none overflow-hidden"
            rows={3}
            {...register("note")}
            onInput={autoGrowTextarea}
          />
        </div>

        {/* 対応可能日程 */}
        {/* date入力はブラウザ固有の最小幅より縮まないため、スマホでは縦積みにする */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="availableStartDate">対応可能開始日</Label>
            <Input id="availableStartDate"  disabled={isSubmitting} type="date" {...register("availableStartDate")} />
          </div>
          <div className="flex-1">
            <Label htmlFor="availableEndDate">対応可能終了日</Label>
            <Input id="availableEndDate" disabled={isSubmitting} type="date" {...register("availableEndDate")} />
          </div>
        </div>

        {/* 報酬（最報酬金額を指定 or 見積もり希望） */}
        <RequestRewardTypeField
          control={control}
          register={register}
          errors={errors}
          disabled={isSubmitting}
        />

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

        {/* サーバーエラー (root.serverError から参照) */}
        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm text-center">{errors.root.serverError.message}</p>
        )}

        {/* 送信ボタン */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "あなたが受注できる情報を投稿する"}
        </Button>
      </form>
    </div>
  );
}