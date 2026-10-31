"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { getEmailError } from "@/app/_utils/companyValidation";
import type {
  SignupResendRequest,
  SignupResendResponse,
} from "@/app/(auth)/signup/_type/signup";

// 会員登録の確認メールを送り直す画面。
// 確認のリンクの期限が切れた人や、確認メールが見つからない人が、会員登録をやり直さずに登録を完了できるようにする
export default function SignupResendPage() {
  // 送信に成功したら送り先のアドレスを覚えておき、フォームの代わりに完了のお知らせを出す。
  // アドレスを完了表示に見せることで、打ち間違いに気づけるようにする（パスワード再設定の画面と同じ作り）
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignupResendRequest>();

  const sendConfirmationEmail = async (data: SignupResendRequest) => {
    clearErrors("root.serverError");

    try {
      const res = await fetch("/api/auth/signup/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: SignupResendResponse = await res.json();

      if (!res.ok) {
        setError("root.serverError", {
          type: "server",
          message: "error" in json ? json.error : "メールの送信に失敗しました",
        });
        return;
      }

      setSentEmail(data.email.trim());
    } catch (e) {
      // 電波が悪いなどで API に届かなかったときも、画面が止まらずに理由が分かるようにする
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (sentEmail) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <p className="text-2xl mb-2">📩</p>
        <h1 className="text-xl font-black text-brand-green-dark mb-4">メールを送信しました</h1>
        {/* 長いアドレスでも画面からはみ出さないよう、break-all で途中でも折り返す */}
        <p className="text-sm font-bold text-slate-700 break-all">{sentEmail}</p>
        {/* 登録の有無や確認の状態で文言を変えると、そのアドレスの状態を他人に知られてしまうため、どの場合もこの文言にする */}
        <p className="text-sm text-slate-600 leading-relaxed text-left mt-4">
          このメールアドレスで会員登録の確認が済んでいない場合は、確認メールが届きます。メール内のリンクから、会員登録を完了してください。
        </p>

        {/* 届かない原因を並べておき、登録の有無を明かさずに、利用者が自分で原因に気づけるようにする */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left">
          <p className="text-sm font-bold text-slate-600">数分たっても届かない場合</p>
          <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-slate-500 leading-relaxed">
            <li>迷惑メールフォルダに入っていないか</li>
            <li>会員登録に使ったメールアドレスか（打ち間違いや、別のアドレスになっていないか）</li>
            <li>すでに会員登録が完了していないか（完了している場合は届きません。そのままログインできます。パスワードがわからない場合は、ログイン画面の「パスワードをお忘れの方はこちら」から再設定できます）</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setSentEmail(null)}
          className="block w-full mt-4 py-3 text-sm text-slate-600 font-bold underline hover:text-slate-800"
        >
          メールアドレスを入力し直す
        </button>
        <Link href="/login" className="block py-3 text-sm text-brand-green-dark font-bold hover:opacity-80">
          ログイン画面に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green-dark mb-2 text-center">確認メールの再送</h1>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        会員登録に使ったメールアドレスを入力してください。登録を完了するための確認メールを、もう一度お送りします。
      </p>

      {/* noValidate でブラウザ標準の吹き出しチェックを止め、すべて入力欄の下の赤字エラー（RHF）で案内する */}
      <form onSubmit={handleSubmit(sendConfirmationEmail)} className="space-y-4" noValidate>
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
          {isSubmitting ? "送信中..." : "確認メールを送る"}
        </Button>
      </form>

      <p className="text-center mt-3">
        <Link href="/login" className="inline-block py-3 text-sm text-slate-600 font-bold underline hover:text-slate-800">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
