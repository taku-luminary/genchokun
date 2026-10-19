import type { LegalRevision, TermsRevision } from "@/app/_types/legal";

// 利用規約・プライバシーポリシーの改定の経過（古い順）。画面の版・最終改定日・改定の経過は、ここから作る。
// 決まり：
// - 公開した版の本文を直すときは、版を上げてここに1行足す。公開した行は書き換えない
// - 公開前（main にマージする前）の下書きは、版を上げずに直してよい
// - 公開日と効力発生日は、公開の直前に、実際に本番へ反映する日で確定する
// - 公開したら、その版の本文と画面を取り出せるよう、注釈つきの git タグ（例 terms-v1.1）を付けて GitHub にも送る。タグは付け替えない
// 同意の画面（"use client"）が版を読むため、本文（terms.ts・privacy.ts）とは別の小さなファイルにして、本文をブラウザに送らないようにしている
export const TERMS_REVISIONS: TermsRevision[] = [
  {
    version: "1.0",
    publishedAt: "2026-10-08",
    effectiveAt: "2026-10-08",
    summary: "",
    notice: "本サービス上に掲載",
    // 同意を記録する仕組みが無かった版
    asksAgreement: false,
  },
  {
    version: "1.1",
    // 公開の直前に、実際に本番へ反映する日（効力発生日はその翌日）に書き換える
    publishedAt: "2026-10-??",
    effectiveAt: "2026-10-??",
    summary: "第5条の記載を本サービスの機能に合わせて修正",
    notice: "本サービス上に掲載、ログイン後の画面で同意のお願い",
    // 今いる会員に初めて同意をお願いする版（それまで同意の記録が無いため）
    asksAgreement: true,
  },
];

export const PRIVACY_REVISIONS: LegalRevision[] = [
  {
    version: "1.0",
    publishedAt: "2026-10-08",
    effectiveAt: "2026-10-08",
    summary: "",
    notice: "本サービス上に掲載",
  },
  {
    version: "1.1",
    // 公開の直前に、実際に本番へ反映する日に書き換える（ポリシーは公開日から適用するので、効力発生日も同じ日）
    publishedAt: "2026-10-??",
    effectiveAt: "2026-10-??",
    summary: "外部サービスの事業者と、個人データが取り扱われる国の記載の訂正、利用規約への同意の記録の追記など",
    notice: "本サービス上に掲載",
  },
];

// 同意の記録（terms_agreements.termsVersion）に入れる値。git のタグと同じ名前にして、記録から本文をたどれるようにする。
// 公開前の確認で記録された下書きへの同意（値 "1.1"）と混ざらないよう、"terms-v" を付ける
export function termsAgreementKey(version: string): string {
  return `terms-v${version}`;
}

const latestTerms = TERMS_REVISIONS[TERMS_REVISIONS.length - 1];

// 今の利用規約の版（画面に出す）と、その版への同意を記録するときの値
export const TERMS_VERSION = latestTerms.version;
export const TERMS_AGREEMENT_KEY = termsAgreementKey(latestTerms.version);

// 同意済みとして扱う記録の値。最後に「同意をお願いし直す」にした版から、今の版まで。
// 版を上げても、その版で同意をお願いし直さない限り、前の版に同意した会員はそのまま同意済みになる
const lastAskIndex = TERMS_REVISIONS.map((revision) => revision.asksAgreement).lastIndexOf(true);
export const ACCEPTED_TERMS_AGREEMENT_KEYS: string[] = TERMS_REVISIONS.slice(Math.max(lastAskIndex, 0)).map(
  (revision) => termsAgreementKey(revision.version)
);
