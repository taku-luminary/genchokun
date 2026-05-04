"use client";

  import { useState } from "react";
  import { useForm } from "react-hook-form";
  import { useRouter } from "next/navigation";
  import { Label } from "@/app/_components/ui/Label";
  import { Input } from "@/app/_components/ui/Input";
  import { Button } from "@/app/_components/ui/Button";
  import { PREFECTURES } from  "@/app/_constants/prefectures";
  import type { CreateProjectRequest } from   "@/app/_types/projects";

  export default function NewProjectPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<CreateProjectRequest>();
    // ===useForm<CreateProjectRequest>();の説明＝＝＝
    // →useFormが返す「道具セット」の中で、フォームの入力データに関係する部分だけがCreateProjectRequest を基準に型付けされる
    // このフォームでは、register("city") とか register("title") とか、CreateProjectRequest に存在する項目名を使います。
    // 送信時に handleSubmit が作る data も、CreateProjectRequest の形として扱います。
    // ただし、register や handleSubmit や isSubmitting 自体がCreateProjectRequest 型になるわけではありません。

    const createProject = async (data: CreateProjectRequest) => {
      setServerError(null);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),  //フォームの入力内容をAPIに渡すために、JSON文字列に変換してリクエスト本文に入れている
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error ?? "投稿に失敗しました");
        return;
      }
      router.push("/mypage");  // 投稿成功 → マイページへ
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">現地調査の投稿フォーム</h1>

        <form onSubmit={handleSubmit(createProject)}  className="space-y-5">
        {/*===handleSubmit(引数) の説明===
          handleSubmit(createProject) は、フォーム送信時に実行される関数」を作る。イメージとしては以下と同じ：
          const submitHandler = handleSubmit(createProject);
          <form onSubmit={submitHandler}>
          ===以下submitHandlerの中身のイメージ====
              ① ブラウザ標準のフォーム送信を止める
              通常のHTMLフォームは送信するとページ遷移・リロードするため
              event.preventDefault();

              ② register で登録された各入力欄の値を RHF 内部から集める
              const data = {
                prefectureId: formValues["prefectureId"],
                city: formValues["city"],
                title: formValues["title"],
                investigationSummary: formValues["investigationSummary"],
                investigationDetails: formValues["investigationDetails"],
                workStartDate: formValues["workStartDate"],
                workEndDate: formValues["workEndDate"],
                rewardYen: formValues["rewardYen"],
                paymentCycle: formValues["paymentCycle"],
              };

               ③ required などのバリデーションを確認する
                 例：prefectureId が空なら errors.prefectureId にエラーを入れる

               ④ エラーがなければ、完成した data を createProject に渡す

              createProject(data);
        */}


          {/* 都道府県 */}
          <div>
            <Label htmlFor="prefectureId">都道府県 *</Label>
            <select                          
              id="prefectureId"
              className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"                  
              {...register("prefectureId", {required: "都道府県を選択してください", valueAsNumber: true,})}                                                                                                                                               
            >   
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.prefectureId && (
              <p className="text-red-500 text-xs  mt-1">{errors.prefectureId.message}</p>
            )}
          </div>

          {/* 市区町村 */}
          <div>
            <Label htmlFor="city">市区町村</Label>
            <Input id="city" placeholder="例：文京区" {...register("city")} />
              {/*===registerの説明=== 
                register("city") は、React Hook Form がこの入力欄を管理するための設定オブジェクトを返す。
                HTML/JSXのタグでは基本的に 属性=値 の形で書く。だから、JSのオブジェクトをそのまま置けない。
                JSX の中で {...オブジェクト} と書くと、オブジェクトの中身が props として展開される。
                つまり： <Input {...register("city")} /> は、イメージとしては以下と同じ：
                <Input
                  name: "city",
                  onChange: (event) => {
                    const value = event.target.value;
                    formValues["city"] = value;}, ← RHFの内部ストアに保存するイメージ
                  onBlur: () => {入力欄から離れたことを記録する},
                  ref: (element) => {このinput要素をRHFが覚える}
                />                
                */}
          </div>

          {/* タイトル */}
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              placeholder="例：太陽光パネルの現地調査"
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
              placeholder="例：太陽光パネル・蓄電池"
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
              placeholder="詳細な内容を記載してください"
              className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              rows={3}
              {...register("investigationDetails")}
            />
          </div>

          {/* 作業日程 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label   htmlFor="workStartDate">作業開始日</Label>
              <Input id="workStartDate" type="date"  {...register("workStartDate")} />
            </div>
            <div className="flex-1">
              <Label htmlFor="workEndDate">作業終了日</Label>
              <Input id="workEndDate" type="date" {...register("workEndDate")} />
            </div>
          </div>

          {/* 報酬 */}
          <div>
            <Label htmlFor="rewardYen">報酬（円）</Label>
            <Input
              id="rewardYen"
              type="number"
              placeholder="例：15000"
              {...register("rewardYen", { valueAsNumber: true })}
            />
          </div>

          {/* 支払サイクル */}
          <div>
            <Label htmlFor="paymentCycle">支払サイクル</Label>
            <Input
              id="paymentCycle"
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
            {isSubmitting ? "投稿中..." : "案件を掲載する"}
          </Button>
        </form>
      </div>
    );
  }