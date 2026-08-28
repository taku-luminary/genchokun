"use client";

import { PrefectureMultiSelect } from "@/app/_components/ui/PrefectureMultiSelect";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { mutate } from 'swr';
import Link from "next/link";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import type { CreateRequestRequest, RequestDetailResponse } from "@/app/_types/requests";
import { RequestRewardTypeField } from "@/app/_components/RequestRewardTypeField";
import { autoGrowTextarea, resizeTextareaEl } from "@/app/_utils/autoGrow";

export default function EditRequestPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // 現在の依頼内容を取得（フォームの初期値に使う）
  const { data, isLoading, error } = useAuthedFetch<RequestDetailResponse>(`/api/requests/${id}`);

  const {
    register,
    handleSubmit,
    control, // ← 追加。Controller に渡す「接続口」
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestRequest>({ defaultValues: { rewardType: "fixed" } });

  // データ取得後にフォームへ現在値を流し込む（日付は先頭10文字で "YYYY-MM-DD" に）
  useEffect(() => {
    if (!data) return;
    reset({
      prefectureIds: data.prefectures.map((p) => p.id), // 複数県の id 配列に変換
      city: data.city ?? undefined,
      title: data.title,
      summary: data.summary ?? undefined,
      note: data.note ?? undefined,
      availableStartDate: data.availableStartDate ? data.availableStartDate.slice(0, 10) : undefined,
      availableEndDate: data.availableEndDate ? data.availableEndDate.slice(0, 10) : undefined,
      rewardType: data.rewardType ?? "fixed",
      rewardMinYen: data.rewardMinYen ?? undefined,
      paymentCycle: data.paymentCycle ?? undefined,
    });
    // 既存テキストに合わせて、開いた直後に textarea の高さを合わせる
    resizeTextareaEl(document.getElementById("summary"));
    resizeTextareaEl(document.getElementById("note"));
  }, [data, reset]);

  const updateRequest = async (formData: CreateRequestRequest) => {
    clearErrors("root.serverError");

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        // エラー応答が JSON でない場合に備え、json() 失敗時は空オブジェクト扱いにする
        const json = await res.json().catch(() => ({}));
        setError("root.serverError", {
          type: "server",
          message: json.error ?? "更新に失敗しました",
        });
        return;
      }
      // 詳細と同じキャッシュを最新化してから戻る（編集内容が即反映されるように）
      await mutate(`/api/requests/${id}`);
      // 保存できたら詳細ページに戻る
      router.push(`/requests/${id}`);
    } catch {
      // fetch 自体の失敗（オフライン・通信断など）をここで拾う
      setError("root.serverError", {
        type: "server",
        message: "通信エラーが発生しました。時間をおいて再度お試しください。",
      });
    }
  };


  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data) return <p className="text-center text-red-500 py-20">依頼の取得に失敗しました</p>;

  // 編集不可ガード（直接URLアクセス対策）。サーバー側(PUT)でも弾く。
  if (!data.isEditable) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-600">
          この依頼は編集できません（マッチング済み、または募集が終了しています）。
        </p>
        <Link href={`/requests/${id}`} className="text-brand-green underline">
          依頼詳細に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">受注可能な情報の編集</h1>

      <form onSubmit={handleSubmit(updateRequest)} className="space-y-5">
        {/* 対応可能エリア（複数選択） */}
        <div>
          <Label htmlFor="prefectureIds">対応可能エリア *（複数選択可）</Label>
          {/* 自作部品は register で接続できないため Controller を使う。
              reset({ prefectureIds: ... }) で入れた既存値は field.value に自動反映され、
              ボタンに県名が「、」区切りで初期表示される。
              required は空配列 [] を通してしまうため、配列の必須チェックは validate で行う */}
          <Controller
            name="prefectureIds"
            control={control}
            rules={{
              validate: (v) => (v && v.length > 0) || "都道府県を1つ以上選択してください",
            }}
            render={({ field }) => (
              <PrefectureMultiSelect
                id="prefectureIds"
                value={field.value ?? []}  // 取得前（undefined）は空配列に変換して渡す
                onChange={field.onChange}  // トグルのたびに number[] が RHF に保存される
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

        {/* 対応可能期間 */}
        {/* date入力はブラウザ固有の最小幅より縮まないため、スマホでは縦積みにする */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="availableStartDate">対応可能開始日</Label>
            <Input id="availableStartDate" disabled={isSubmitting} type="date" {...register("availableStartDate")} />
          </div>
          <div className="flex-1">
            <Label htmlFor="availableEndDate">対応可能終了日</Label>
            <Input id="availableEndDate" disabled={isSubmitting} type="date" {...register("availableEndDate")} />
          </div>
        </div>

        {/* 報酬（報酬金額を指定 or 見積もり希望） */}
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

        {/* サーバーエラー */}
        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm">{errors.root.serverError.message}</p>
        )}

        {/* 送信ボタン */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "変更を保存する"}
        </Button>
      </form>
    </div>
  );
}
