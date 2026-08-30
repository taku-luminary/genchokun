import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import type { CompanyMeResponse } from "@/app/_types/companies";

// ログイン中ユーザーの自社情報の登録状況を1か所で扱うフック。
// 各ページは useCompany() を呼ぶだけで「登録済みか」を判定できる。
export function useCompany() {
  const swr = useAuthedFetch<CompanyMeResponse>("/api/companies/me");
  // company が入っていれば登録済み。読み込み中(undefined)は false 扱いになる。
  const isRegistered = swr.data?.company != null;
  return { ...swr, isRegistered };
}
