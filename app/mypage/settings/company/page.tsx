"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PREFECTURES } from "@/app/_constants/prefectures";
import type {
  CompanyMeResponse,
  UpdateCompanyRequest,
} from "@/app/_types/companies";

export default function CompanySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCompanyRequest>();

  // 画面初回表示：自社情報を取得し、登録済みならフォームに流し込む
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/companies/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json: CompanyMeResponse = await res.json();
      if (json.company) {
        // 既存データを初期値にセット（reset でフォーム全体を上書き）
        reset({
          name:               json.company.name,
          prefectureId:       json.company.prefectureId,
          city:               json.company.city               ?? undefined,
          address:            json.company.address            ?? undefined,
          representativeName: json.company.representativeName ?? undefined,
          employeeCount:      json.company.employeeCount      ?? undefined,
          websiteUrl:         json.company.websiteUrl         ?? undefined,
          description:        json.company.description        ?? undefined,
        });
        setIsNew(false);
      } else {
        setIsNew(true);
      }
      setLoading(false);
    };
    load();
  }, [reset, router]);

  const saveCompany = async (data: UpdateCompanyRequest) => {
    setServerError(null);
    setSavedMessage(null);

    const res = await fetch("/api/companies/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error ?? "保存に失敗しました");
      return;
    }
    setSavedMessage("自社情報を保存しました");
    setIsNew(false); // 新規→編集モードへ切り替わる
  };

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 py-10">読み込み中...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
        自社情報の{isNew ? "登録" : "編集"}
      </h1>
      <p className="text-sm text-slate-500 mb-8 text-center">
        登録した内容は、案件・依頼の詳細ページで相手に表示されます
      </p>

      <form onSubmit={handleSubmit(saveCompany)} className="space-y-5">
        {/* 会社名 */}
        <div>
          <Label htmlFor="name">会社名 *</Label>
          <Input
            id="name"
            disabled={isSubmitting}
            placeholder="例：株式会社現調"
            {...register("name", { required: "会社名を入力してください" })}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* 都道府県 */}
        <div>
          <Label htmlFor="prefectureId">都道府県 *</Label>
          <select
            id="prefectureId"
            disabled={isSubmitting}
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            {...register("prefectureId", {
              required: "都道府県を選択してください",
              valueAsNumber: true,
            })}
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.prefectureId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.prefectureId.message}
            </p>
          )}
        </div>

        {/* 市区町村 */}
        <div>
          <Label htmlFor="city">市区町村</Label>
          <Input
            id="city"
            disabled={isSubmitting}
            placeholder="例：文京区"
            {...register("city")}
          />
        </div>

        {/* 住所 */}
        <div>
          <Label htmlFor="address">住所</Label>
          <Input
            id="address"
            disabled={isSubmitting}
            placeholder="例：本郷1-2-3"
            {...register("address")}
          />
        </div>

        {/* 代表者名 */}
        <div>
          <Label htmlFor="representativeName">代表者名</Label>
          <Input
            id="representativeName"
            disabled={isSubmitting}
            placeholder="例：山田太郎"
            {...register("representativeName")}
          />
        </div>

        {/* 従業員数 */}
        <div>
          <Label htmlFor="employeeCount">従業員数（人）</Label>
          <Input
            id="employeeCount"
            disabled={isSubmitting}
            type="number"
            placeholder="例：10"
            {...register("employeeCount", { valueAsNumber: true })}
          />
        </div>

        {/* Webサイト */}
        <div>
          <Label htmlFor="websiteUrl">Webサイト URL</Label>
          <Input
            id="websiteUrl"
            disabled={isSubmitting}
            type="url"
            placeholder="https://example.com"
            {...register("websiteUrl")}
          />
        </div>

        {/* 自社紹介 */}
        <div>
          <Label htmlFor="description">自社紹介</Label>
          <textarea
            id="description"
            disabled={isSubmitting}
            placeholder="事業内容や強みなど"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={4}
            {...register("description")}
          />
        </div>

        {/* サーバーエラー / 成功メッセージ */}
        {serverError  && <p className="text-red-500 text-sm">{serverError}</p>}
        {savedMessage && <p className="text-green-600 text-sm">{savedMessage}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : isNew ? "登録する" : "更新する"}
        </Button>
      </form>
    </div>
  );
}