"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type { SignupRequest, SignupResponse } from "@/app/(auth)/signup/_type/signup";

// フォームで扱う値。確認用パスワードは打ち間違いのチェックにだけ使い、API には送らない
type FormData = SignupRequest & {
  confirmPassword: string;
};

export default function SignupPage() {
  // 送信に成功したら送り先のアドレスを覚えておき、フォームの代わりに完了のお知らせを出す。
  // アドレスを完了表示に見せることで、打ち間違いに気づけるようにする（パスワード再設定の画面と同じ作り）
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  // これはイメージとして、内部にこういう管理箱を作ります。
  // const internalFormState = {
  //  values: {email: "",password: "", confirmPassword: "",},
  //  rules: {},
  //  errors: {},
  //  isSubmitting: false,
  // };

  const sendSignupData = async ({ email, password }: FormData) => {
    clearErrors('root.serverError');

    const body: SignupRequest = { email, password };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: SignupResponse = await res.json();

      if (!res.ok) {
        setError('root.serverError', {
          type: 'server',
          message: "error" in json ? json.error : "会員登録に失敗しました",
        });
        return;
      }

      setSentEmail(email);
    } catch (e) {
      // 電波が悪いなどで API に届かなかったときも、画面が止まらずに理由が分かるようにする
      console.error(e);
      setError('root.serverError', {
        type: 'network',
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (sentEmail) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <p className="text-2xl mb-2">📩</p>
        <h1 className="text-xl font-black text-brand-green mb-4">確認メールを送りました</h1>
        {/* 長いアドレスでも画面からはみ出さないよう、break-all で途中でも折り返す */}
        <p className="text-sm font-bold text-slate-700 break-all">{sentEmail}</p>
        <p className="text-sm text-slate-600 leading-relaxed text-left mt-4">
          メール内のリンクを押して、会員登録を完了してください。
        </p>

        {/* 登録済みのアドレスだと、Supabase はエラーを返さずメールも送らない。届かない原因の1つとして案内しておく */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left">
          <p className="text-sm font-bold text-slate-600">数分たっても届かない場合</p>
          <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-slate-500 leading-relaxed">
            <li>迷惑メールフォルダに入っていないか</li>
            <li>メールアドレスに打ち間違いがないか</li>
            <li>すでに会員登録済みのアドレスではないか（登録済みの場合は届きません。ログイン画面の「パスワードをお忘れの方はこちら」から再設定できます）</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setSentEmail(null)}
          className="block w-full mt-4 py-3 text-sm text-brand-green font-bold hover:underline"
        >
          メールアドレスを入力し直す
        </button>
        <Link href="/login" className="block py-3 text-sm text-brand-green font-bold hover:underline">
          ログイン画面へ
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green mb-6
text-center">会員登録</h1>

      <form onSubmit={handleSubmit(sendSignupData)} className="space-y-4">

      {/* handleSubmit の中ではこういうことが起きるイメージ
      function handleSubmit(sendSignupData) {
        return function (event) {
          event.preventDefault();

          const data = {
            email: internalFormState.values.email,
            password: internalFormState.values.password,
            confirmPassword: internalFormState.values.confirmPassword,
          };
          sendSignupData(data);
        };
      } */}
          <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            // ブラウザに保存されているメールアドレスを候補に出してもらう
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email", {
              required: "メールアドレスを入力してください",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "正しいメールアドレスを入力してください",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">パスワード（{PASSWORD_MIN_LENGTH}文字以上）</Label>
          <Input
            id="password"
            type="password"
            // パスワード管理機能に「新しく作るパスワード」だと伝え、強いパスワードの提案や保存をしてもらう
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("password", {
              required: "パスワードを入力してください",
              minLength: {
                value: PASSWORD_MIN_LENGTH,
                message: `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`,
              },
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("confirmPassword", {
              required: "確認用パスワードを入力してください",
              // 第2引数 formValues には、チェック時点のフォーム全項目の値が入る。
              // watch() と違って入力のたびに画面を再描画しないので、チェックのためだけならこちらを使う
              validate: (value, formValues) =>
                value === formValues.password || "パスワードが一致しません",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm">{errors.root.serverError.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "会員登録"}
        </Button>
      </form>

      {/* ログイン画面と同じく、ほかの画面への導線はボタンの下に、文全体をリンクにして置く */}
      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="block py-3 text-sm text-brand-green font-bold hover:underline"
        >
          会員登録済みの方はこちら
        </Link>
      </div>
    </div>
  );
}
