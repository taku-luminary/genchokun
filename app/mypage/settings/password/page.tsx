"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Label } from "@/app/_components/ui/Label";
import { Input } from "@/app/_components/ui/Input";
import { Button } from "@/app/_components/ui/Button";
import { PASSWORD_MIN_LENGTH } from "@/app/_constants/auth";
import type { ChangePasswordRequest, ChangePasswordResponse } from "@/app/_types/auth";

// フォームで扱う値。確認用パスワードは打ち間違いのチェックにだけ使い、API には送らない
type FormData = ChangePasswordRequest & {
  confirmPassword: string;
};

export default function PasswordSettingsPage() {
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // 変更に成功したら reset() でこの値（空欄）に戻し、パスワードを画面に残さない
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePassword = async ({ currentPassword, newPassword }: FormData) => {
    clearErrors("root.serverError");
    setSavedMessage(null);

    const body: ChangePasswordRequest = { currentPassword, newPassword };

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: ChangePasswordResponse = await res.json();

      if (!res.ok) {
        setError("root.serverError", {
          type: "server",
          message: "error" in json ? json.error : "パスワードの変更に失敗しました",
        });
        return;
      }

      reset();
      setSavedMessage("パスワードを変更しました");
    } catch (e) {
      console.error(e);
      setError("root.serverError", {
        type: "network",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link
        href="/mypage/settings"
        className="inline-block py-3 text-sm text-slate-500 hover:text-brand-green"
      >
        ‹ 各種設定に戻る
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mt-2 mb-2 text-center">
        パスワードの変更
      </h1>
      <p className="text-sm text-slate-500 mb-8 text-center">
        ログインに使うパスワードを変更します
      </p>

      <form onSubmit={handleSubmit(changePassword)} className="space-y-5">
        {/* 現在のパスワード（本人確認用） */}
        <div>
          <Label htmlFor="currentPassword">現在のパスワード</Label>
          <Input
            id="currentPassword"
            type="password"
            // ブラウザや iPhone のパスワード管理機能が「今のパスワード」を自動入力できるようにする
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register("currentPassword", {
              required: "現在のパスワードを入力してください",
            })}
          />
          {errors.currentPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* 新しいパスワード */}
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

        {/* 新しいパスワード（確認） */}
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
          <p className="text-red-500 font-bold text-sm text-center">
            {errors.root.serverError.message}
          </p>
        )}
        {savedMessage && (
          <p className="text-green-600 font-bold text-sm text-center">{savedMessage}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "変更中..." : "パスワードを変更する"}
        </Button>
      </form>
    </div>
  );
}
