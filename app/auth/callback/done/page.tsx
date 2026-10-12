"use client";

import { useEffect } from "react";
import { reloadAfterAuthChange } from "@/app/_utils/authChange";

// 確認メールのリンク（/auth/callback）でログインしたあとに、一瞬だけ通る画面。
// 前の会員の応募の下書きをこのタブから消し、ほかのタブにも知らせてから、トップページを開き直す
export default function CallbackDonePage() {
  useEffect(() => {
    reloadAfterAuthChange("/");
  }, []);

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-start justify-center px-4 pt-24">
      <p className="text-sm text-slate-500">ログインしています...</p>
    </div>
  );
}
