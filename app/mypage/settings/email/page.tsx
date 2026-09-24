"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  AccountEmailResponse,
  ChangeEmailRequest,
  ChangeEmailResponse,
} from "@/app/mypage/settings/email/_type/emailChange";

export default function EmailSettingsPage() {
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // 今のアドレスと確認待ちのアドレスを取得する。
  // 使うのはこの画面だけなのでカスタムフックにはせず、ここでURLを書く（管理ダッシュボードと同じ形）
  const { data, error, isLoading, mutate } =
    useAuthedFetch<AccountEmailResponse>("/api/account/email");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailRequest>({
    // 送信に成功したら reset() でこの値（空欄）に戻し、パスワードを画面に残さない
    defaultValues: { newEmail: "", currentPassword: "" },
  });

  const changeEmail = async (formData: ChangeEmailRequest) => {
    clearErrors("root.serverError");
    setSavedMessage(null);

    try {
      const res = await fetch("/api/account/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json: ChangeEmailResponse = await res.json();

      if (!res.ok) {
        setError("root.serverError", {
          type: "server",
          message: "error" in json ? json.error : "確認メールの送信に失敗しました",
        });
        return;
      }

      reset();
      setSavedMessage("確認メールを送信しました");
      // 確認待ちのアドレスを取り直して、下の「確認待ち」の表示を最新にする
      await mutate();
    } catch (e) {
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-md px-4 py-10">読み込み中...</div>;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm font-bold text-red-500">
        通信に失敗しました。時間をおいて再度お試しください
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">
        ログイン用メールアドレスの変更
      </h1>
      <p className="mb-6 text-center text-sm text-slate-500">
      ログインに使うメールアドレスを変更します。<br/>取引相手に表示されるメールアドレスではありません。
      </p>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-600">現在のログイン用メールアドレス</p>
        {/* 長いアドレスでも画面からはみ出さないよう、break-all で途中でも折り返す */}
        <p className="mt-1 break-all text-sm text-slate-800">{data.email}</p>
      </div>

      {/* 確認待ちがあるときだけ出す。送信先を見せて、打ち間違いに気づけるようにする */}
      {data.newEmail && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-700">確認待ちのメールアドレス</p>
          <p className="mt-1 break-all text-sm font-bold text-slate-800">{data.newEmail}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            このアドレスに届いたメールのリンクを開くと、変更が完了します。完了するまでは、これまでのメールアドレスでログインしてください。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            数分たっても届かない場合は、迷惑メールフォルダをご確認ください。アドレスを間違えていた場合は、下のフォームからもう一度送信できます（送り直しは1分以上あけてください）。
          </p>
        </div>
      )}

      {/* noValidate でブラウザ標準の吹き出しチェックを止め、すべて入力欄の下の赤字エラー（RHF）で案内する */}
      <form onSubmit={handleSubmit(changeEmail)} className="mt-6 space-y-5" noValidate>
        <div>
          <Label htmlFor="newEmail">新しいメールアドレス</Label>
          <Input
            id="newEmail"
            type="email"
            // ブラウザに保存されているメールアドレスを候補に出してもらう
            autoComplete="email"
            disabled={isSubmitting}
            placeholder="例：taro@example.co.jp"
            {...register("newEmail", {
              required: "新しいメールアドレスを入力してください",
              validate: (value) => getEmailError(value) ?? true,
            })}
          />
          {errors.newEmail && (
            <p className="mt-1 text-xs text-red-500">{errors.newEmail.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="currentPassword">現在のパスワード</Label>
          <Input
            id="currentPassword"
            type="password"
            // パスワード管理機能に「今のパスワード」だと伝え、保存したパスワードを自動入力してもらう
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register("currentPassword", {
              required: "現在のパスワードを入力してください",
            })}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
          </p>
        </div>

        {errors.root?.serverError?.message && (
          <p className="text-center text-sm font-bold text-red-500">
            {errors.root.serverError.message}
          </p>
        )}
        {savedMessage && (
          <p className="text-center text-sm font-bold text-brand-green-dark">{savedMessage}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "確認メールを送る"}
        </Button>
      </form>

      {/* 補助的なリンクはメインのボタンの下にまとめ、文全体を押せるようにする。
          主役は上の「確認メールを送る」ボタンなので、色は控えめにし、下線でリンクだと分かるようにする */}
      <div className="mt-4 text-center">
        <Link
          href="/mypage/settings/company"
          className="block py-3 text-sm text-slate-500 underline hover:text-slate-700"
        >
          マッチング相手に表示される<br/>連絡用メールアドレスを変えたい方はこちら
        </Link>
      </div>
    </div>
  );
}
