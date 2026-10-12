"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { hasMemberChanged, reloadAfterAuthChange, takeAuthChangeError } from "@/app/_utils/authChange";
import type { LoginRequest, LoginResponse } from "@/app/(auth)/login/_type/login";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();

  // ログインの途中で失敗して読み込み直したときは、読み込み直す前の失敗の理由をここで出す
  useEffect(() => {
    const message = takeAuthChangeError();
    if (message) {
      setError('root.serverError', { type: 'server', message });
    }
  }, [setError]);

  const onSubmit = async (data: LoginRequest) => {
    clearErrors('root.serverError');

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: LoginResponse = await res.json();

      if (!res.ok) {
        const message = "error" in json ? json.error : "ログインに失敗しました";
        // 失敗でも、ログインの状態だけ変わっていることがある（例: ログインのあとのデータベースの処理で失敗した）。
        // そのときは前の会員のデータを残さないよう、この画面を読み込み直してからエラー文を出す
        if (await hasMemberChanged()) {
          reloadAfterAuthChange("/login", message);
          return;
        }
        setError('root.serverError', { type: 'server', message });
        return;
      }

      // ログインした会員が入れ替わるので、ページ全体を読み込み直して、前の会員のデータをメモリと下書きから捨てる
      reloadAfterAuthChange("/");
    } catch (e) {
      // 電波が悪いなどで API に届かなかったときも、画面が止まらずに理由が分かるようにする
      console.error(e);
      setError('root.serverError', {
        type: 'network',
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green-dark mb-6 text-center">ログイン</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            // ブラウザやパスワード管理機能に保存されているメールアドレスを候補に出してもらう
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
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            // パスワード管理機能に「ログイン用の今のパスワード」だと伝え、保存したパスワードを自動入力してもらう
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register("password", {
              required: "パスワードを入力してください",
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm">{errors.root.serverError.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      {/* ログイン以外への導線は、入力の流れを邪魔しないようボタンの下にまとめ、同じ見た目で並べる。
          文全体をリンクにして押せる範囲を広げ、リンクの文字だけで行き先が分かるようにする */}
      <div className="mt-4 text-center">
        <Link
          href="/password-reset"
          className="block py-3 text-sm text-slate-600 font-bold underline hover:text-slate-800"
        >
          パスワードをお忘れの方はこちら
        </Link>
        <Link
          href="/signup"
          className="block py-3 text-sm text-slate-600 font-bold underline hover:text-slate-800"
        >
          会員登録がまだの方はこちら
        </Link>
      </div>
    </div>
  );
}
