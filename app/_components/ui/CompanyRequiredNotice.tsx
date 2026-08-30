"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 自社情報が未登録のとき、投稿・応募ページの中央に出す案内。
// 「登録する」を押すと登録画面へ遷移し、保存後に元の画面へ戻れるよう
// ?return= に現在のパスを渡す（戻す処理は登録画面側の後続ステップで対応）。
export function CompanyRequiredNotice() {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-slate-700 font-bold">この操作には自社情報の登録が必要です。</p>
      <p className="text-sm text-slate-500">
        投稿や応募を行う際は以下より登録をお願いします。
      </p>
      <Link
        href={`/mypage/settings/company?return=${returnTo}`}
        className="inline-block bg-brand-green text-white font-bold px-6 py-3 rounded-xl"
      >
        自社情報を登録する
      </Link>
    </div>
  );
}
