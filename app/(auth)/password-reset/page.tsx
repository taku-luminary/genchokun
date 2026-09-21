"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  PasswordResetRequest,
  PasswordResetResponse,
} from "@/app/(auth)/password-reset/_type/passwordReset";

export default function PasswordResetPage() {
  // 送信に成功したら、フォームの代わりに完了のお知らせを出す（会員登録の画面と同じ作り）
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequest>();

  const sendResetEmail = async (data: PasswordResetRequest) => {
    clearErrors("root.serverError");

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: PasswordResetResponse = await res.json();

      if (!res.ok) {
        setError("root.serverError", {
          type: "server",
          message: "error" in json ? json.error : "メールの送信に失敗しました",
        });
        return;
      }

      setSent(true);
    } catch (e) {
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <p className="text-2xl mb-2">📩</p>
        <h1 className="text-xl font-black text-brand-green mb-4">メールを送信しました</h1>
        {/* 登録の有無で文言を変えると、そのアドレスが登録済みかどうかを他人に知られてしまうため、どちらの場合もこの文言にする */}
        <p className="text-sm text-slate-600 leading-relaxed text-left">
          入力したメールアドレスが登録されている場合は、パスワード再設定用のメールが届きます。メール内のリンクから、新しいパスワードを設定してください。
        </p>
        <p className="text-xs text-slate-500 leading-relaxed text-left mt-3">
          数分たっても届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 py-3 text-sm text-brand-green font-bold hover:underline"
        >
          ログイン画面に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green mb-2 text-center">パスワードの再設定</h1>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        登録しているメールアドレスを入力してください。パスワードを再設定するためのリンクをお送りします。
      </p>

      {/* noValidate でブラウザ標準の吹き出しチェックを止め、すべて入力欄の下の赤字エラー（RHF）で案内する */}
      <form onSubmit={handleSubmit(sendResetEmail)} className="space-y-4" noValidate>
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
              validate: (value) => getEmailError(value) ?? true,
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm">{errors.root.serverError.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "再設定メールを送る"}
        </Button>
      </form>

      <p className="text-center mt-3">
        <Link href="/login" className="inline-block py-3 text-sm text-brand-green font-bold hover:underline">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
