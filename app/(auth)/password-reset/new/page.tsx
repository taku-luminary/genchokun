"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type {
  NewPasswordRequest,
  PasswordResetResponse,
} from "@/app/(auth)/password-reset/_type/passwordReset";

// フォームで扱う値。トークンは入力欄ではなく URL から読むので除き、打ち間違いのチェック用に確認用パスワードを足す
type FormData = Omit<NewPasswordRequest, "token_hash"> & {
  confirmPassword: string;
};

export default function NewPasswordPage() {
  const router = useRouter();
  // 成功したら、フォームの代わりに完了のお知らせを出す（再設定メールの送信画面と同じ作り）
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const setNewPassword = async ({ newPassword }: FormData) => {
    clearErrors("root.serverError");

    // 送信ボタンを押したこの瞬間に、URL からトークンを読み取る（/auth/confirm と同じ）。
    // 画面を開いただけではトークンを使わないので、メールのスキャナがリンクを先読みしても無効にならない
    const token_hash = new URLSearchParams(window.location.search).get("token_hash");
    if (!token_hash) {
      setError("root.serverError", {
        type: "client",
        message: "リンクが正しくありません。メールのリンクから開き直すか、もう一度メールを送信して下さい",
      });
      return;
    }

    const body: NewPasswordRequest = { token_hash, newPassword };

    try {
      const res = await fetch("/api/auth/password-reset/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: PasswordResetResponse = await res.json();

      if (!res.ok) {
        setError("root.serverError", {
          type: "server",
          message: "error" in json ? json.error : "パスワードの再設定に失敗しました",
        });
        return;
      }

      // API の中でログインした状態になっている。
      // refresh() で、ヘッダーなどサーバーで作られた部分を、ログインした状態の表示に作り直す
      router.refresh();
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-black text-brand-green-dark mb-4">パスワードを再設定しました</h1>
        <p className="text-sm text-slate-600 leading-relaxed text-left mb-6">
          次回から新しいパスワードでログインして下さい。<br/>現在はログインした状態になっています。
        </p>
        <Button type="button" onClick={() => router.push("/")}>
          トップページへ進む
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green-dark mb-2 text-center">新しいパスワードの設定</h1>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        新しいパスワードを入力してください。設定が終わると、そのままログインした状態になります。
      </p>

      <form onSubmit={handleSubmit(setNewPassword)} className="space-y-4">
        <div>
          <Label htmlFor="newPassword">新しいパスワード（{PASSWORD_MIN_LENGTH}文字以上）</Label>
          <Input
            id="newPassword"
            type="password"
            // パスワード管理機能に「新しいパスワード」だと伝え、強いパスワードの提案や保存をしてもらう
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("newPassword", {
              required: "新しいパスワードを入力してください",
              minLength: {
                value: PASSWORD_MIN_LENGTH,
                message: `新しいパスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`,
              },
            })}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("confirmPassword", {
              required: "確認用のパスワードを入力してください",
              // 第2引数 formValues には、チェック時点のフォーム全項目の値が入る。
              // watch() と違って入力のたびに画面を再描画しないので、チェックのためだけならこちらを使う
              validate: (value, formValues) =>
                value === formValues.newPassword || "新しいパスワードが一致しません",
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
          {isSubmitting ? "設定中..." : "パスワードを設定する"}
        </Button>
      </form>

      {/* リンクの期限切れ・使用済みのときにここから申し込み直せるよう、エラーの種類で出し分けずに常に出しておく */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">リンクの有効期限が切れた場合や、使用済みの場合は</p>
        <Link
          href="/password-reset"
          className="inline-block py-3 text-sm text-slate-600 font-bold underline hover:text-slate-800"
        >
          再設定メールを送り直す
        </Link>
      </div>
    </div>
  );
}
