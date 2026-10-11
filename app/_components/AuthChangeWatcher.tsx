"use client";

import { useEffect, useState } from "react";
import { clearApplyDrafts } from "@/app/_utils/applyDraft";
import { hasMemberChanged, onAuthChangeNotice, setPageMemberId } from "@/app/_utils/authChange";

type Props = {
  userId: string | null; // このページを表示したときにログインしていた会員の ID（未ログインなら null）
};

// ほかのタブでのログアウト・別の会員でのログインや、「戻る」でのページの復元のあとに、
// 前の会員の情報や応募の下書きがこのタブに残らないよう見張る（画面には何も表示しない）。
// ヘッダーに置き、すべてのページで動かす
export function AuthChangeWatcher({ userId }: Props) {
  // 表示したときの会員を覚えておく。あとでヘッダーが作り直されて userId が変わっても、
  // メモリ上のデータは表示したときの会員のものなので、比べる相手は変えない
  const [pageMemberId] = useState(userId);

  useEffect(() => {
    setPageMemberId(pageMemberId);
    // 未ログインで表示したページには会員の情報が無いので、見張らない
    if (pageMemberId === null) return;

    // 会員が入れ替わっていたら、このタブの下書きを消して、いまのページを読み込み直す
    const reloadIfMemberChanged = async () => {
      if (await hasMemberChanged()) {
        clearApplyDrafts();
        window.location.reload();
      }
    };

    // タブに戻ってきたとき（スマホでアプリを切り替えて戻ったときも含む）に確かめる。
    // ほかのタブからの合図を受け取れなかったときも、ここで気づける
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void reloadIfMemberChanged();
    };

    // ブラウザが「戻る」「進む」のためにこのページをメモリへ残すとき（bfcache）は、先に画面を隠す。
    // 戻ってきたときに、前の会員の画面が一瞬でも見えないようにするため
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) document.documentElement.style.visibility = "hidden";
    };
    // メモリから戻したページは、その間に会員が入れ替わっていても古いままなので、サーバーから読み込み直す
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };

    const stopNotice = onAuthChangeNotice(() => void reloadIfMemberChanged());
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      stopNotice();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pageMemberId]);

  return null;
}
