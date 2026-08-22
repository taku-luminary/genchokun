"use client";

import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import type { MypageApiResponse } from "@/app/_types/mypage";

// ヘッダーの「マイページ」右上に出す未読お知らせの赤丸。
// 点灯条件はマイページのお知らせタイルと同じ（3件数のいずれか > 0）。
export function MypageNoticeDot() {
  const { data } = useAuthedFetch<MypageApiResponse>("/api/mypage");
  const s = data?.stats;
  const hasNotice =
    !!s && (s.reviewPendingCount > 0 || s.todoCount > 0 || s.newMatchCount > 0);

  // お知らせが無いときは何も描画しない（赤丸を出さない）
  if (!hasNotice) return null;

  return (
    <span
      aria-label="お知らせがあります"
      className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-400"
    />
  );
}
