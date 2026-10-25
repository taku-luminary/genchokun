"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TERMS_AGREEMENT_PATH } from "@/app/_utils/termsAgreement";

type Props = {
  // 第1.1版の利用制限の対象か（開始日以後で、第1.1版以後への同意の記録が無く、管理者でない）。ヘッダーがサーバー側で判定して渡す
  isRestricted: boolean;
};

// 入口でも同意の画面へ移さない画面。同意の画面から別のタブで規約・ポリシーを開いたときや、
// 問い合わせ（退会の連絡）・ログイン・メールの確認の途中で、開けなくならないようにする
const OPEN_PATHS = ["/terms", "/privacy", "/contact", "/login", "/signup", "/password-reset", "/password-reset/new"];
const OPEN_PATH_PREFIXES = ["/auth/"];

// 同意のあとに使う画面（新しい投稿・投稿の編集・新しい応募）。いつ開いても同意の画面へ移す。
// 当事者でない募集の詳細は API が断り、詳細の画面はデータの取得のときに同意の画面へ移る（useAuthedFetch）
const BLOCKED_PATH_PATTERNS = [/^\/(projects|requests)\/new$/, /^\/(projects|requests)\/[^/]+\/(edit|apply)$/];

// このタブでページを開いてから、同意の画面を一度通ったか。
// モジュールの変数にしているのは、画面の中の移動では値が残り、ページ全体を読み込み直す
// （ログインの直後・再読み込み・新しいタブ）と false に戻るため。これで「ページを開いた最初の1回」を表す。
// 書き換えるのはブラウザの useEffect の中だけなので、サーバーで画面を作るときは常に false のまま
let hasVisitedAgreementPage = false;

// 第1.1版の利用制限の入口のルールを受け持つ（ヘッダーに置き、すべてのページで動かす）。
// - ログインの直後と、ページを開いた最初の1回は、同意の画面へ移す（ログインのあとはページ全体を読み込み直すので、どちらも最初の1回に当たる）
// - そのあとは、画面の中の移動で、同意の前でも使える画面へ行ける
// - 同意のあとに使う画面は、いつ開いても同意の画面へ移す
// 移すまでのあいだは、画面を覆って中身を見せない。同意すると、ヘッダーが作り直されて isRestricted が false になり、すぐに外れる
export function TermsAgreementGate({ isRestricted }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isAgreementPage = pathname === TERMS_AGREEMENT_PATH;
  const isOpenPage =
    OPEN_PATHS.includes(pathname) || OPEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isBlockedPage = BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
  const shouldMove =
    isRestricted && !isAgreementPage && !isOpenPage && (isBlockedPage || !hasVisitedAgreementPage);

  useEffect(() => {
    if (isRestricted && isAgreementPage) hasVisitedAgreementPage = true;
  }, [isRestricted, isAgreementPage]);

  useEffect(() => {
    // replace にして、移す前の画面を「戻る」の履歴に残さない（戻ると、また移されるため）
    if (shouldMove) router.replace(TERMS_AGREEMENT_PATH);
  }, [shouldMove, router]);

  if (!shouldMove) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white px-4">
      <p className="text-sm text-slate-500">利用規約への同意の画面へ移動しています...</p>
    </div>
  );
}
