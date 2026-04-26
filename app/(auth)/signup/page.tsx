"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  // これはイメージとして、内部にこういう管理箱を作ります。
  // const internalFormState = {
  //  values: {email: "",password: "", confirmPassword: "",},
  //  rules: {},
  //  errors: {},
  //  isSubmitting: false,
  // };

  const sendSignupData = async (data: FormData) => {
    setServerError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <p className="text-2xl mb-2">📩</p>
        <h1 className="text-xl font-black text-brand-green mb-2">確認メールを送りました</h1>
        <p className="text-sm text-slate-500">
          送信されたメール内のリンクを<br />
          クリックして登録を完了してください。
        </p>
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
            {...register("password", {
              required: "パスワードを入力してください",
              minLength: {
                value: 8,
                message: "パスワードは8文字以上で入力してください",
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
            {...register("confirmPassword", {
              required: "確認用パスワードを入力してください",
              validate: (value) =>
                value === watch("password") || "パスワードが一致しません",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-red-500 text-sm">{serverError}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "会員登録"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        すでにアカウントをお持ちの方は{" "}
        <a href="/login" className="text-brand-green font-bold hover:underline">
          ログイン
        </a>
      </p>
    </div>
  );
}