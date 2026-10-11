"use client";

import { useState } from "react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { ButtonListItem } from "@/app/_components/ui/LinkList";
import { hasMemberChanged, reloadAfterAuthChange } from "@/app/_utils/authChange";
import { logout } from "./actions";

// 各種設定ページの一番下に置く、ログアウトの行（LinkList の中に置く）。
// ログアウト後は、ログインしていなくても見られるトップページへ移動する
export function LogoutButton() {
  // 二度押しでログアウト処理が重ねて動かないよう、処理中は押せなくする
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // ログアウトに失敗したときに、行の中に出すメッセージ
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage("");
    try {
      const { ok } = await logout();
      if (ok) {
        // ログインの Cookie が消えたので、ページ全体を読み込み直して、前の会員のデータをメモリから捨てる
        reloadAfterAuthChange("/");
        return;
      }
    } catch (e) {
      // 通信の失敗などで、ログアウトの処理まで届かなかったとき
      console.error(e);
    }
    // 失敗の途中でログインだけ外れていることもあるので確かめ、外れていればログアウトできたものとして進める
    if (await hasMemberChanged()) {
      reloadAfterAuthChange("/");
      return;
    }
    // ログインは残っているので、理由を出して、もう一度押せるように戻す
    setErrorMessage("ログアウトできませんでした。通信の状態を確かめて、もう一度お試しください");
    setIsLoggingOut(false);
  }

  return (
    <ButtonListItem
      title={isLoggingOut ? "ログアウト中..." : "ログアウト"}
      description={errorMessage}
      icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
      onClick={handleLogout}
      disabled={isLoggingOut}
      muted
    />
  );
}
