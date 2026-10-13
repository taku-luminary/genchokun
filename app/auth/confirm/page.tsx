"use client";

import { useState } from "react";
import Link from "next/link";
import { reloadAfterAuthChange } from "@/app/_utils/authChange";
import type { ConfirmResponse } from "@/app/auth/_type/confirm";

export default function ConfirmPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    setMessage("");

    // ボタンを押したこの瞬間に、URL から確認情報を読み取る。
    // スキャナの先読み(GET)ではここは実行されないため、トークンは消費されない。
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // このボタンは「利用規約に同意して登録を完了する」なので、同意したことを API に伝え、版と日時を記録してもらう
        body: JSON.stringify({ token_hash, type, agreedToTerms: true }),
      });
      const json: ConfirmResponse = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage("error" in json ? json.error : "確認に失敗しました");
        return;
      }

      // 確認成功。verifyOtp でログイン済みになっているのでトップへ。
      // 同じブラウザで別の会員が使っていた場合に備え、ページ全体を読み込み直して前の会員のデータを捨てる
      reloadAfterAuthChange("/");
    } catch (e) {
      // 電波が悪いなどで API に届かなかったときや、返事が JSON でなかったときも、
      // 「確認中...」のまま止まらずに理由が分かるようにする
      console.error(e);
      setStatus("error");
      setMessage("通信に失敗しました。時間をおいて再度お試しください");
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-start justify-center px-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-black text-brand-green-dark mb-4">
          ユーザー認証
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          下のボタンを押して登録を完了してください。
        </p>

        {/* 登録を完了するボタンを押すことが利用規約への同意になることを、ボタンの直前と文言の両方で示す。
            プライバシーポリシーは、会員登録の画面と同じく同意ではなく「確認」として並べる。
            別タブで開くのは、読みに行ってもこの画面（メールのリンクの情報）を失わないようにするため */}
        <p className="text-xs leading-relaxed text-slate-500 text-left mb-4">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700"
          >
            利用規約
          </Link>
          と
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700"
          >
            プライバシーポリシー
          </Link>
          をご確認のうえ、お進みください。
        </p>

        {status === "error" && (
          <p className="text-red-500 text-sm mb-4">{message}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={status === "loading"}
          className="w-full bg-brand-green text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {status === "loading" ? "確認中..." : "利用規約に同意して登録を完了する"}
        </button>
      </div>
    </div>
  );

}
