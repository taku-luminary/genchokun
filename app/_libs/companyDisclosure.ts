import { ACCEPTED_TERMS_AGREEMENT_KEYS } from "@/app/_constants/legal/revisions";

// 代表者名と町名・番地・建物名（address）を、ほかの人に表示してよい会社かを決めるための部品。
// 確認画面と同意の画面では、同意のボタンが、登録済みの会社情報をこの範囲で公開することへの同意にもなると示している。
// そのため、この2項目は、会員のアカウントで利用規約に同意した記録がある会社だけ、企業ページ・案件の詳細・依頼待ちの詳細で表示する。
// 本人向けの画面（自社情報の編集・マイページの自分の案件）は、自分の情報を確かめるためのものなので、この判定を使わない。
// 「同意済み」の考え方はヘッダーの案内と同じく ACCEPTED_TERMS_AGREEMENT_KEYS にそろえる（公開前の下書きの "1.1" の記録は数えない）。
// 今の判定のまま、将来、版を上げて asksAgreement を true にすると、同意し直すまでこの2項目も表示されなくなる。
// 公開範囲を変えない再同意で非公開に戻す必要はないので、その設定変更のときに、過去の有効な公開への同意を続けて扱えるよう判定を見直す（法務トリガー表 C 節）

// Prisma の select / include の termsAgreements にそのまま渡す。同意済みとして扱う記録が1件あるかだけを見る
export const ACCEPTED_TERMS_AGREEMENTS_QUERY = {
  where: { termsVersion: { in: ACCEPTED_TERMS_AGREEMENT_KEYS } },
  select: { id: true },
  take: 1,
} as const;

// 同意の記録が無い会社では、代表者名と町名・番地・建物名を空（null）にして返す。ほかの項目はそのまま。
// 画面のカード（CompanyInfoCard）は、空の項目を表示しない
export function hideUnagreedCompanyFields<T extends { representativeName: string | null; address: string | null }>(
  company: T,
  hasAgreed: boolean
): T {
  if (hasAgreed) return company;
  return { ...company, representativeName: null, address: null };
}
