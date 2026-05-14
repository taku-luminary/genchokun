"use client";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PREFECTURES } from "@/app/_constants/prefectures";
import type {
  CompanyMeResponse,
  UpdateCompanyRequest,
} from "@/app/_types/companies";

export default function CompanySettingsPage() {
  const [isNew, setIsNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCompanyRequest>();

  const {
    data,
    error,
    isLoading,
  } = useAuthedFetch<CompanyMeResponse>("/api/companies/me");



  // 画面初回表示：自社情報を取得し、登録済みならフォームに流し込む
  useEffect(() => {
    if (!data) return;
    if (data.company) {
      /*
        reset は React Hook Form が用意している関数。
        このページでは、最初にフォームを表示した時点では、まだ会社情報のデータを持っていない。
        その後、useAuthedFetch("/api/companies/me") でAPIから既存の会社情報を取得し、
        取得できた値をフォームにまとめて反映するために reset を使っている。

        イメージとしては以下の2つを同時に行う。
        1. React Hook Form 内部のフォーム値を更新する
            例：formValues.name = json.company.name;
        2. register で接続済みの input / select / textarea の表示にも反映する
            例：registeredFields.name.value = formValues.name ?? "";
        つまり reset({...}) は、「DBに保存済みの会社情報を、編集フォームの初期値として流し込む処理」。

        register("name") などで登録した名前と、 reset に渡すオブジェクトのキー名は対応している必要がある。

        例：
        register("name") に対応する値 → reset({ name: ... })
        register("city") に対応する値 → reset({ city: ... })
      */

        reset({
          name: data.company.name,
          // register("name") に対応。会社名 input に既存の会社名を入れる
          prefectureId: data.company.prefectureId,
          // register("prefectureId") に対応。都道府県 select の選択状態を復元する
          city: data.company.city ?? undefined,
          address: data.company.address ?? undefined,
          representativeName: data.company.representativeName ?? undefined,
          employeeCount: data.company.employeeCount ?? undefined,
          websiteUrl: data.company.websiteUrl ?? undefined,
          description: data.company.description ?? undefined,
        });

      // 既存の会社情報があるので、この画面は「新規登録」ではなく「編集」モードにする
      setIsNew(false);
    } else {
      // 会社情報がまだ存在しない場合は「新規登録」モードにする
      setIsNew(true);
    }
  }, [data, reset]);

  const saveCompany = async (data: UpdateCompanyRequest) => {
    setServerError(null);
    setSavedMessage(null);
  
    try {
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
      setIsNew(false);// 新規→編集モードへ切り替わる
    } catch (e) {
      console.error(e);
      setServerError("通信に失敗しました。時間をおいて再度お試しください");
    }
  };

  if (isLoading) {
    return <div className="max-w-xl mx-auto px-4 py-10">読み込み中...</div>;
  }
  
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-red-500 font-bold text-sm text-center">
        通信に失敗しました。時間をおいて再度お試しください
      </div>
    );
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
          {/*===registerの説明=== 
              ① 入力欄の名前をRHFに教える
              ② 入力が変わったら内部ストアを更新する onChange を渡す
              ③ blurしたことを記録する onBlur を渡す
              ④ input要素そのものを覚える ref を渡す
            register("city") は、React Hook Form がこの入力欄を管理するための設定オブジェクトを返す。
            HTML/JSXのタグでは基本的に 属性=値 の形で書く。だから、JSのオブジェクトをそのまま置けない。
            JSX の中で {...オブジェクト} と書くと、オブジェクトの中身が props として展開される。
            つまり： <Input {...register("city")} /> は、イメージとしては以下と同じ：
            <Input
              name: "city",
              onChange: (event) => {
                const value = event.target.value;
                formValues["city"] = value;}, ← RHFの内部ストアに保存するイメージ
              onBlur: () => {入力欄から離れたことを記録する}, ← 入力欄から離れたことをRHFが記録する、 バリデーションや touched 状態の管理に使われる
              ref: (element) => {registeredFields["city"] = element;} ← このinput要素そのものをRHFが覚える。これにより、reset時に、registeredFields["city"].value = "文京区";のように、画面上のinputへ値を反映できる
            /> 

            ■役割
              formValues → RHF内部の正式なフォームデータ置き場
              formValues.name = ... → 保存時に使う内部データを更新する
              registeredFields → 実際のinput/select/textarea要素の置き場
              registeredFields.name.value = ... → 画面上のinputに表示する値を更新する
              register → inputをRHFに接続し、onChangeで内部データを更新できるようにし、refでinput要素も覚えられるようにする
            */}
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
            // ref: (element) => {
              // RHFがこのinput要素を覚える。
              // reset() 実行時に、
              // registeredFields.address.value = "本郷1-2-3"
              // のように値を反映できるようになる
            // }
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
            rows={5}
            {...register("description")}
          />
        </div>

        {/* サーバーエラー / 成功メッセージ */}
        {serverError  && <p className="text-red-500 font-bold text-sm text-center">{serverError}</p>}
        {savedMessage && <p className="text-green-600 font-bold text-sm text-center">{savedMessage}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : isNew ? "登録する" : "更新する"}
        </Button>
      </form>
    </div>
  );
}