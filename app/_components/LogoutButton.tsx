"use client";

import { useRouter } from "next/navigation";
import { logout } from "./actions";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-bold text-slate-600 hover:text-brand-green transition-colors"
    >
      ログアウト
    </button>
  );
}