"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import type { LoginRequest, LoginResponse } from "@/app/(auth)/login/_type/login";

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();


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
        setError('root.serverError', {
          type: 'server',
          message: "error" in json ? json.error : "ログインに失敗しました",
        });
        return;
      }

      router.push("/");
      router.refresh();
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
      <h1 className="text-2xl font-black text-brand-green mb-6
text-center">ログイン</h1>

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
          className="block py-3 text-sm text-brand-green font-bold hover:underline"
        >
          パスワードをお忘れの方はこちら
        </Link>
        <Link
          href="/signup"
          className="block py-3 text-sm text-brand-green font-bold hover:underline"
        >
          会員登録がまだの方はこちら
        </Link>
      </div>
    </div>
  );
}
