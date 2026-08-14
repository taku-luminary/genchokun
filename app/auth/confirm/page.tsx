"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
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

    const res = await fetch("/api/auth/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_hash, type }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setStatus("error");
      setMessage(json.error ?? "確認に失敗しました");
      return;
    }

    // 確認成功。verifyOtp でログイン済みになっているのでトップへ。
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-start justify-center px-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-black text-brand-green mb-4">
          ユーザー認証
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          下のボタンを押して登録を完了してください。
        </p>

        {status === "error" && (
          <p className="text-red-500 text-sm mb-4">{message}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={status === "loading"}
          className="w-full bg-brand-green text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {status === "loading" ? "確認中..." : "ユーザー認証をする"}
        </button>
      </div>
    </div>
  );

}
