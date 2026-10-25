import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { hasTermsV1_1RestrictionStarted, isTermsV1_1RestrictionTarget } from "@/app/_constants/legal/revisions";
import { TERMS_AGREEMENT_REQUIRED_CODE } from "@/app/_utils/termsAgreement";
import type { TermsAgreementRequiredResponse } from "@/app/_types/legal";

// 同意が必要で断るときのメッセージ。投稿・応募・評価のフォームは、この文をそのまま出す
const TERMS_AGREEMENT_REQUIRED_MESSAGE =
  "この操作には利用規約への同意が必要です。画面上部の案内から、同意のお手続きをお願いします";

// 第1.1版の利用制限：ログイン中の会員が、新しい投稿・応募などの前に利用規約への同意が必要かを返す。
// getAuthUser() を通った会員の ID を渡す（ログインしていない人・利用停止中の人は、呼び出し側が先に 401 で断る）。
// 開始日の前は DB を読まずに false を返すので、開始日までは今までどおり動く
export async function isTermsAgreementRequired(userId: string): Promise<boolean> {
  if (!hasTermsV1_1RestrictionStarted()) return false;

  const member = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      // 同意の記録の版（会員ごとに、同意した版の数だけ。多くても数件）
      termsAgreements: { select: { termsVersion: true } },
    },
  });
  // getAuthUser() が users の行を確かめたあとなので、通常は行がある。無ければ制限の対象にしない
  if (!member) return false;

  return isTermsV1_1RestrictionTarget(
    member.isAdmin,
    member.termsAgreements.map((agreement) => agreement.termsVersion)
  );
}

// 同意が必要で断る返事。403 に印（code）を付けて、ログインしていない（401）と区別する。
// 画面はこの印を見て同意の画面へ移す（ログインの画面へは移さない）
export function termsAgreementRequiredResponse(): NextResponse<TermsAgreementRequiredResponse> {
  return NextResponse.json(
    { error: TERMS_AGREEMENT_REQUIRED_MESSAGE, code: TERMS_AGREEMENT_REQUIRED_CODE },
    { status: 403 }
  );
}
