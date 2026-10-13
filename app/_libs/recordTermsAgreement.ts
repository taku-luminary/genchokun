import { prisma } from "@/app/_libs/prisma";
import { TERMS } from "@/app/_constants/legal/terms";
import type { TermsAgreementSource } from "@/app/_types/legal";

// 会員が利用規約に同意したことを、同意した版・日時・画面とともに記録する共通関数。
// 版は、そのときに公開している利用規約の版（TERMS.version）を記録する。
// 同じ会員の同じ版の記録が既にあれば何もしない（skipDuplicates）。押し直しても最初に同意した日時を上書きしないため。
// ボタンの二度押しなどで同時に呼ばれても、DB の一意制約（会員×版）で1行にそろう
export async function recordTermsAgreement(userId: string, source: TermsAgreementSource): Promise<void> {
  await prisma.terms_agreements.createMany({
    data: [{ userId, termsVersion: TERMS.version, source }],
    skipDuplicates: true,
  });
}
