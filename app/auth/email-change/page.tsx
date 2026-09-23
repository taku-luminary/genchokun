"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import type { ConfirmRequest, ConfirmResponse } from "@/app/auth/_type/confirm";

export default function EmailChangePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    setMessage("");

    // ボタンを押したこの瞬間に、URL から確認用のトークンを読み取る。
    // スキャナの先読み(GET)ではここは実行されないため、トークンは消費されない
    const token_hash = new URLSearchParams(window.location.search).get("token_hash");
    if (!token_hash) {
      setStatus("error");
      setMessage("リンクが正しくありません。メールのリンクから開き直してください");
      return;
    }

    // この画面はメールアドレス変更の確認にしか使わないので、type は固定にする
    const body: ConfirmRequest = { token_hash, type: "email_change" };

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: ConfirmResponse = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage("error" in json ? json.error : "確認に失敗しました");
        return;
      }

      // 確認に成功すると、この端末はログインした状態になっている。
      // refresh() で、ヘッダーなどサーバーで作られた部分を新しいアドレスの表示に作り直す
      router.refresh();
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMessage("通信に失敗しました。時間をおいて再度お試しください");
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-start justify-center px-4 pt-24">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        {status === "done" ? (
          <>
            <h1 className="text-xl font-black text-brand-green mb-4">
              メールアドレスを変更しました
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed text-left mb-6">
              次回から新しいメールアドレスでログインしてください。
              <br />
              現在はログインした状態になっています。
            </p>
            <Button type="button" onClick={() => router.push("/")}>
              トップページへ進む
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-brand-green mb-4">
              メールアドレス変更の確認
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              下のボタンを押すと、ログイン用メールアドレスの変更が完了します。
            </p>

            {status === "error" && (
              <p className="text-red-500 text-sm mb-4">{message}</p>
            )}

            <Button type="button" onClick={handleConfirm} disabled={status === "loading"}>
              {status === "loading" ? "確認中..." : "変更を完了する"}
            </Button>

            {/* リンクの期限切れ・使用済みのときに申し込み直せるよう、エラーの種類で出し分けずに常に出しておく。
                この画面のメインは「変更を完了する」ボタンなので、補助のリンクは色を落として下線で示す */}
            <div className="mt-6">
              <p className="text-xs text-slate-500">
                リンクの有効期限が切れた場合や、使用済みの場合は
              </p>
              <Link
                href="/mypage/settings/email"
                className="inline-block py-3 text-sm text-slate-500 underline hover:text-slate-700"
              >
                各種設定からもう一度変更する
              </Link>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
