"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { ButtonListItem } from "@/app/_components/ui/LinkList";
import { logout } from "./actions";

// 各種設定ページの一番下に置く、ログアウトの行（LinkList の中に置く）。
// ログアウト後は、ログインしていなくても見られるトップページへ移動する
export function LogoutButton() {
  const router = useRouter();
  // 二度押しでログアウト処理が重ねて動かないよう、処理中は押せなくする
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      // ヘッダーはサーバー側で表示を作っているため、再読み込みして「ログイン・会員登録」の表示に切り替える
      router.refresh();
    } catch (e) {
      // 通信の失敗などでログアウトできなかったときは、もう一度押せるように戻す
      console.error(e);
      setIsLoggingOut(false);
    }
  }

  return (
    <ButtonListItem
      title={isLoggingOut ? "ログアウト中..." : "ログアウト"}
      icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
      onClick={handleLogout}
      disabled={isLoggingOut}
      muted
    />
  );
}
