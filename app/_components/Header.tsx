import React from "react";
import { createClient } from "@/app/_libs/supabase/server";
import { prisma } from "@/app/_libs/prisma";
import { recordLastSeen } from "@/app/_libs/recordLastSeen";
import {
  ACCEPTED_TERMS_AGREEMENT_KEYS,
  TERMS_V1_1_RESTRICTION_STARTS_ON,
  hasTermsV1_1RestrictionStarted,
  isTermsV1_1RestrictionTarget,
} from "@/app/_constants/legal/revisions";
import { formatYmdJa } from "@/app/_utils/format";
import { TERMS_AGREEMENT_PATH } from "@/app/_utils/termsAgreement";
import { MypageNoticeDot } from "./MypageNoticeDot";
import { AuthChangeWatcher } from "./AuthChangeWatcher";
import { TermsAgreementGate } from "./TermsAgreementGate";
import Link from "next/link";

export const Header = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ログイン中なら、users の行から「サービスを使えるか（isActive）」「管理者か」と自社の企業ID、
  // 利用規約への同意の記録の版（会員ごとに、同意した版の数だけ。多くても数件）をまとめて取得する
  const member = user
    ? await prisma.users.findUnique({
        where: { id: user.id },
        select: {
          isActive: true,
          isAdmin: true,
          company: { select: { id: true } },
          termsAgreements: { select: { termsVersion: true } },
        },
      })
    : null;
  // users の行が無い人と利用停止中の人（退会を含む）は、会員向けの機能を使えない（getAuthUser と同じ判定）
  const canUseService = member?.isActive === true;
  const agreedTermsKeys = member?.termsAgreements.map((agreement) => agreement.termsVersion) ?? [];
  // 同意済みとして扱う版（revisions.ts で最後に同意をお願いし直した版から今の版まで）への同意の記録が無い会員には、同意の画面への案内を出す。
  // 版を上げても、その版で同意をお願いし直さない限り、同意済みの会員には出ない
  const needsTermsAgreement =
    member?.isActive === true && !agreedTermsKeys.some((key) => ACCEPTED_TERMS_AGREEMENT_KEYS.includes(key));
  // 第1.1版の利用制限の対象の会員か（管理者を除き、第1.1版以後への同意の記録が無い会員。API と同じ判定）。
  // 開始日の前は帯で開始日を知らせ、開始日以後は同意の画面を通してもらう
  const isTermsV1_1Target =
    member?.isActive === true && isTermsV1_1RestrictionTarget(member.isAdmin, agreedTermsKeys);
  const isTermsRestricted = isTermsV1_1Target && hasTermsV1_1RestrictionStarted();

  if (user && canUseService) {
    // 「今アプリを開いた」ことを記録する（管理ダッシュボードの「最終訪問」に使う）
    await recordLastSeen(user.id);
  }
  // 自社の企業ID（未登録なら null）
  const companyId = member?.company ? member.company.id.toString() : null;
  // 企業ページがあればそこへ、なければ登録（編集）ページへ
  const companyHref = companyId ? `/companies/${companyId}` : "/mypage/settings/company";
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 px-4 py-3 md:px-8">
        {/* ほかのタブでの会員の入れ替わりや「戻る」での復元に気づいて、前の会員の情報を残さないための見張り役（何も表示しない） */}
        <AuthChangeWatcher userId={user?.id ?? null} />
        {/* 第1.1版の利用制限の対象の会員を、入口のルールで同意の画面へ移す（対象でなければ何も表示しない） */}
        <TermsAgreementGate isRestricted={isTermsRestricted} />
        <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#34b38a"/>
                <path d="M12 20L18 26L28 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10L30 30" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round"/>
              </svg>
              <div className="ml-2">
                {/* サービス名はブランドの見え方を優先し、文字用の brand-green-dark ではなく brand-green のままにする */}
                <h1 className="text-xl font-bold text-brand-green leading-tight">電工くん</h1>
                <p className="hidden md:block text-[10px] text-slate-400 font-medium">電気工事・調査のマッチングサービス</p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-3 md:gap-8">
          {user && canUseService ? (
            <>
              <span className="text-sm text-slate-500 hidden md:block">{user.email}</span>
              <Link
                href="/mypage"
                className="relative text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
              >
                マイページ
                <MypageNoticeDot />
              </Link>
              <Link
                href={companyHref}
                className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
              >
                自社情報
              </Link>
              <Link
                href="/mypage/settings"
                className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
              >
                各種設定
              </Link>

            </>
          ) : user ? (
            <>
              {/* サービスを使えない状態でもログアウトはできるよう、ログアウトのある各種設定への入口だけ残す */}
              <span className="text-sm text-slate-500 hidden md:block">{user.email}</span>
              <Link
                href="/mypage/settings"
                className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
              >
                各種設定
              </Link>
            </>
          ) : (
              <>
                <Link href="/signup" className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
                >会員登録</Link>
                <Link href="/login" className="text-xs md:text-sm font-bold text-slate-600 hover:text-brand-green-dark transition-colors whitespace-nowrap"
                >ログイン</Link>
              </>
            )}
          </nav>
        </div>
        {user && canUseService && !companyId && (
        <Link
          href="/mypage/settings/company"
          className="block -mx-4 md:-mx-8 -mb-3 mt-3 bg-red-50 px-4 py-1.5 text-center text-xs md:text-sm font-bold text-red-500 hover:underline"
          >
          自社情報が未登録です。投稿・応募には登録が必要です。
        </Link>
      )}
        {needsTermsAgreement && (
        <Link
          href={TERMS_AGREEMENT_PATH}
          className="block -mx-4 md:-mx-8 -mb-3 mt-3 bg-red-50 px-4 py-3 text-center text-xs md:text-sm font-bold text-red-500 hover:underline"
          >
          {/* 第1.1版の利用制限の対象の会員には、開始日の前は開始日を（日付は revisions.ts の1か所から出す）、開始日以後は同意までできないことを知らせる。
              管理者は制限の対象外なので、同意のお願いだけを出す */}
          {isTermsRestricted ? (
            <>利用規約への同意をお願いします。同意いただくまで、新しい投稿・応募などはご利用いただけません。内容の確認と同意はこちら</>
          ) : isTermsV1_1Target ? (
            <>利用規約への同意をお願いします。{formatYmdJa(TERMS_V1_1_RESTRICTION_STARTS_ON)}からは、同意がお済みでないと新しい投稿・応募などができなくなります。内容の確認と同意はこちら</>
          ) : (
            <>利用規約への同意をお願いします。内容の確認と同意はこちら</>
          )}
        </Link>
      )}
        {user && !canUseService && (
        <Link
          href="/contact"
          className="block -mx-4 md:-mx-8 -mb-3 mt-3 bg-red-50 px-4 py-3 text-center text-xs md:text-sm font-bold text-red-500 hover:underline"
          >
          このアカウントは現在ご利用いただけません。お問い合わせはこちら
        </Link>
      )}
      </header>
    );
  };
