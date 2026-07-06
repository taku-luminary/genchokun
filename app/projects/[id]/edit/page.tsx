"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PREFECTURES } from "@/app/_constants/prefectures";
import type { CreateProjectRequest, ProjectDetailResponse } from "@/app/_types/projects";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // 現在の案件内容を取得（フォームの初期値に使う）
  const { data, isLoading, error } = useAuthedFetch<ProjectDetailResponse>(`/api/projects/${id}`);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectRequest>();

  // データ取得が完了したら、フォームに現在値を流し込む。
  // 日付は ISO 文字列("2026-01-31T00:00:00.000Z")なので先頭10文字だけ取り出して
  // date入力が扱える "2026-01-31" 形式にする。

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
  useEffect(() => {
    if (!data) return;
    reset({
      prefectureId: data.prefectureId,
      city: data.city ?? undefined,
      title: data.title,
      investigationSummary: data.investigationSummary ?? undefined,
      investigationDetails: data.investigationDetails ?? undefined,
      workStartDate: data.workStartDate ? data.workStartDate.slice(0, 10) : undefined,
      workEndDate: data.workEndDate ? data.workEndDate.slice(0, 10) : undefined,
      rewardYen: data.rewardYen ?? undefined,
      paymentCycle: data.paymentCycle ?? undefined,
    });
  }, [data, reset]);

  const updateProject = async (formData: CreateProjectRequest) => {
    clearErrors("root.serverError");

    try {
      const res = await fetch(`/api/projects/${id}`, {
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
      // 保存できたら詳細ページに戻る
      router.push(`/projects/${id}`);
    } catch {
      // fetch 自体の失敗（オフライン・通信断など）をここで拾う
      setError("root.serverError", {
        type: "server",
        message: "通信エラーが発生しました。時間をおいて再度お試しください。",
      });
    }
  };

  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data) return <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>;

  // 編集不可ガード（直接URLアクセス対策）。
  // サーバー側(PUT)でも弾くが、ここで先に分かりやすく案内する。
  if (!data.isEditable) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-600">
          この案件は編集できません（応募が来ている、または募集が終了しています）。
        </p>
        <Link href={`/projects/${id}`} className="text-brand-green underline">
          案件詳細に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center">案件の編集</h1>

    <form onSubmit={handleSubmit(updateProject)} className="space-y-5">
      {/*=== handleSubmit(updateProject) の説明 ===
        「変更を保存する」ボタンは type="submit" なので、クリックすると form の onSubmit が動く。

        handleSubmit(updateProject) は、フォーム送信時に実行される関数を作る。イメージとしては以下と同じ：

        const submitHandler = handleSubmit(updateProject);
        <form onSubmit={submitHandler}>

        === submitHandler の中身のイメージ ===
          ① ブラウザ標準のフォーム送信を止める
          ② register で登録された各入力欄の現在値を集める
          ③ required などのバリデーションを確認する
          ④ エラーがなければ、完成した formData を updateProject に渡す

          updateProject(formData);

        この編集画面では reset({...}) によって、取得済みの案件データが最初からフォームに入っている。
        そのため、何も変更せずに保存しても、reset で入った既存値が formData に入って送信される。
      */}

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
        {/* select は「プルダウン全体」を作るHTMLタグ。
            option を選ぶと、その option の value が select の現在値になる。

            編集画面では reset({ prefectureId: data.prefectureId }) によって、
            APIから取得した都道府県IDが最初から入っている。
            そのため、対応する option が最初から選択された状態になる。 */}

        {/*=== register の説明 ===
          ① 入力欄の名前を RHF に教える
          ② 選択が変わったら内部ストアを更新する onChange を渡す
          ③ blur したことを記録する onBlur を渡す
          ④ select 要素そのものを覚える ref を渡す

          register("prefectureId") は、React Hook Form がこの select を管理するための設定オブジェクトを返す。
          HTML/JSX のタグでは基本的に 属性=値 の形で書く。 だから、JS のオブジェクトをそのまま置けない。
          JSX の中で {...オブジェクト} と書くと、オブジェクトの中身が props として展開される。
          つまり： <select {...register("prefectureId", { required: "...", valueAsNumber: true })} />
          は、イメージとしては以下と同じ：

          <select
            name="prefectureId"
            onChange={(event) => {
              const value = event.target.value;
              formValues["prefectureId"] = Number(value);
            }}
            onBlur={() => {
              入力欄から離れたことを RHF が記録する;
            }}
            ref={(element) => {
              registeredFields["prefectureId"] = element;
            }}
          />

          ※ formValues や registeredFields は理解用のイメージ。RHF の実際の内部変数名という意味ではない。

          ■役割
            formValues → RHF 内部のフォームデータ置き場のイメージ
            formValues["prefectureId"] = ... → 保存時に使う内部データを更新するイメージ
            registeredFields → 実際の input / select / textarea 要素の置き場のイメージ
            registeredFields["prefectureId"].value = ... → reset 時に画面上の select に値を反映するイメージ
            register → select を RHF に接続し、onChange で内部データを更新できるようにし、ref で select 要素も覚えられるようにする

          ■ reset との関係
            この編集画面では、useEffect 内で reset({prefectureId: data.prefectureId,}) が実行される。
            register("prefectureId") によって、この select は RHF に接続されているため、 reset で入れた prefectureId の値が画面にも反映される。
            例：data.prefectureId が 3 の場合、value={3} の option が最初から選択された状態になる。
        */}


          {/* 未選択用の選択肢。value="" なので、都道府県が選ばれていない状態を表す */}
          <option value="">選択してください</option>

          {PREFECTURES.map((p) => (
            // key   → React用の目印。送信データには入らない。
            // value → フォーム用の値。選ばれると formData.prefectureId に入る。
            // {p.name} → ユーザーに見える都道府県名。
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            placeholder="詳細な内容を記載してください"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={3}
            {...register("investigationDetails")}
          />
        </div>

        {/* 作業日程 */}
        {/* date入力はブラウザ固有の最小幅より縮まないため、スマホでは縦積みにする */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="workStartDate">作業開始日</Label>
            <Input id="workStartDate" disabled={isSubmitting} type="date" {...register("workStartDate")} />
          </div>
          <div className="flex-1">
            <Label htmlFor="workEndDate">作業終了日</Label>
            <Input id="workEndDate" disabled={isSubmitting} type="date" {...register("workEndDate")} />
          </div>
        </div>

        {/* 報酬 */}
        <div>
          <Label htmlFor="rewardYen">報酬（円）</Label>
          <Input
            id="rewardYen"
            disabled={isSubmitting}
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
