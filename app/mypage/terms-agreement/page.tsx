"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import { CompanyPublicInfoNotice } from "@/app/_components/CompanyPublicInfoNotice";
import { TERMS_AGREEMENT_KEY, TERMS_VERSION } from "@/app/_constants/legal/revisions";
import type {
  TermsAgreementRequest,
  TermsAgreementResponse,
} from "@/app/mypage/terms-agreement/_type/termsAgreement";

// 利用規約への同意をお願いする画面。同意済みとして扱う版にまだ同意していない会員に、ヘッダーの案内から来てもらう。
// 同意は、この画面のボタンが押されたときだけ記録する（同意した版・日時・画面は API が残す）
export default function TermsAgreementPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleAgree = async () => {
    setStatus("loading");
    setMessage("");

    // 画面に表示した版も一緒に送る。開いている間に改定されていたら、API は記録せずに読み込み直しを求める
    const body: TermsAgreementRequest = { agreed: true, termsVersion: TERMS_AGREEMENT_KEY };

    try {
      const res = await fetch("/api/account/terms-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: TermsAgreementResponse = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage("error" in json ? json.error : "同意を記録できませんでした");
        return;
      }

      setStatus("done");
      // ヘッダーの案内はサーバー側で作っているので、表示を作り直して消す
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMessage("通信に失敗しました。時間をおいて再度お試しください");
    }
  };

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">同意を記録しました</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          利用規約にご同意いただき、ありがとうございます。
        </p>
        <Button type="button" onClick={() => router.push("/")}>
          トップページへ進む
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">利用規約への同意</h1>
      <p className="text-sm text-slate-500 mb-8 text-center">
        内容をご確認のうえ、同意をお願いします
      </p>

      <div className="space-y-5">
        {/* 別タブで開くのは、読み終えたあとにこの画面へ戻って同意できるようにするため */}
        <p className="text-sm text-slate-600 leading-relaxed">
          電工くんの
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-800"
          >
            利用規約
          </Link>
          （第{TERMS_VERSION}版）と
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-800"
          >
            プライバシーポリシー
          </Link>
          をご確認ください。
        </p>

        {/* 企業ページの公開範囲は会員への影響が大きいので、同意の前にこの画面でも示す */}
        <CompanyPublicInfoNotice />

        {status === "error" && (
          <p className="text-red-500 font-bold text-sm text-center">{message}</p>
        )}

        <Button type="button" onClick={handleAgree} disabled={status === "loading"}>
          {status === "loading" ? "記録しています..." : "利用規約に同意する"}
        </Button>
      </div>
    </div>
  );
}
