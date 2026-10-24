import { prisma } from "@/app/_libs/prisma";
import { TERMS_AGREEMENT_KEY } from "@/app/_constants/legal/revisions";
import type { TermsAgreementSource } from "@/app/_types/legal";

// 画面を開いている間に利用規約が改定され、画面に表示した版と今の版が違ったときに返すメッセージ。
// 読み込み直すと今の版が表示されるので、もう一度押してもらう
export const TERMS_UPDATED_MESSAGE =
  "利用規約が更新されました。お手数ですが、画面を読み込み直してから、もう一度お進みください";

// 会員が利用規約に同意したことを、同意した版・日時・画面とともに記録する共通関数。
// 版は、今公開している利用規約の版の値（例 terms-v1.1）を記録する。呼び出す API は、画面に表示した版が今の版と同じことを先に確かめる。
// 同じ会員の同じ版の記録が既にあれば何もしない（skipDuplicates）。押し直しても最初に同意した日時を上書きしないため。
// ボタンの二度押しなどで同時に呼ばれても、DB の一意制約（会員×版）で1行にそろう
export async function recordTermsAgreement(userId: string, source: TermsAgreementSource): Promise<void> {
  await prisma.terms_agreements.createMany({
    data: [{ userId, termsVersion: TERMS_AGREEMENT_KEY, source }],
    skipDuplicates: true,
  });
}
