"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import type {
  AdminArticleResponse,
  UpsertArticleRequest,
} from "@/app/_types/articles";

export default function AdminArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const [isNew, setIsNew] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<UpsertArticleRequest>({
    defaultValues: { status: "draft" }, // 初期は下書き
  });

  // 既存記事の取得（管理者でなければ API が 403 → error に入る）
  const { data, error, isLoading } = useAuthedFetch<AdminArticleResponse>(
    `/api/admin/companies/${id}/article`
  );

  // 初回表示：既存記事があればフォームに流し込む
  useEffect(() => {
    if (!data) return;
    if (data.article) {
      reset({
        title: data.article.title,
        introText: data.article.introText ?? undefined,
        companyIntroText: data.article.companyIntroText ?? undefined,
        workStyleText: data.article.workStyleText ?? undefined,
        // 既存が archived でも、簡易版の編集では draft/published のみ扱う
        status: data.article.status === "published" ? "published" : "draft",
      });
      setIsNew(false);
    } else {
      setIsNew(true);
    }
  }, [data, reset]);

  const saveArticle = async (formData: UpsertArticleRequest) => {
    clearErrors("root.serverError");
    setSavedMessage(null);

    try {
      const res = await fetch(`/api/admin/companies/${id}/article`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = await res.json();
        setError("root.serverError", {
          type: "server",
          message: json.error ?? "保存に失敗しました",
        });
        return;
      }
      setSavedMessage("記事を保存しました");
      setIsNew(false);
    } catch (e) {
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (isLoading) {
    return <div className="max-w-xl mx-auto px-4 py-10">読み込み中...</div>;
  }

  // 403（非管理者）や通信失敗はまとめてここで弾く
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center space-y-4">
        <p className="text-red-500 font-bold text-sm">
          この画面は管理者専用です。または読み込みに失敗しました。
        </p>
        <Link href="/" className="inline-block text-brand-green underline">
          トップに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
        企業インタビュー記事の{isNew ? "作成" : "編集"}
      </h1>
      <p className="text-sm text-slate-500 mb-8 text-center">
        公開すると、この企業のページに以下記事が表示されます
      </p>

      <form onSubmit={handleSubmit(saveArticle)} className="space-y-5">
        {/* 記事タイトル */}
        <div>
          <Label htmlFor="title">記事タイトル *</Label>
          <Input
            id="title"
            disabled={isSubmitting}
            placeholder="例：現場を支えるプロ集団のこだわり"
            {...register("title", { required: "記事タイトルを入力してください" })}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* 導入文 */}
        <div>
          <Label htmlFor="introText">導入文</Label>
          <textarea
            id="introText"
            disabled={isSubmitting}
            placeholder="記事の冒頭に表示される短い紹介文"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={3}
            {...register("introText")}
          />
        </div>

        {/* 会社紹介セクション */}
        <div>
          <Label htmlFor="companyIntroText">会社紹介</Label>
          <textarea
            id="companyIntroText"
            disabled={isSubmitting}
            placeholder="事業内容・沿革・強みなど"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={6}
            {...register("companyIntroText")}
          />
        </div>

        {/* 働き方セクション */}
        <div>
          <Label htmlFor="workStyleText">働き方</Label>
          <textarea
            id="workStyleText"
            disabled={isSubmitting}
            placeholder="職場の雰囲気・1日の流れ・募集要項など"
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            rows={6}
            {...register("workStyleText")}
          />
        </div>

        {/* 公開状態 */}
        <div>
          <Label htmlFor="status">公開状態 *</Label>
          <select
            id="status"
            disabled={isSubmitting}
            className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            {...register("status", { required: true })}
          >
            <option value="draft">下書き（公開ページに表示しない）</option>
            <option value="published">公開（公開ページに表示する）</option>
          </select>
        </div>

        {/* サーバーエラー / 成功メッセージ */}
        {errors.root?.serverError?.message && (
          <p className="text-red-500 font-bold text-sm text-center">
            {errors.root.serverError.message}
          </p>
        )}
        {savedMessage && (
          <p className="text-green-600 font-bold text-sm text-center">
            {savedMessage}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : isNew ? "作成する" : "更新する"}
        </Button>
      </form>

      {/* 公開ページへの確認リンク */}
      <div className="text-center mt-6">
        <Link
          href={`/companies/${id}`}
          className="text-sm text-brand-green underline"
        >
          公開ページを確認する
        </Link>
      </div>
    </div>
  );
}
