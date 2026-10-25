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
    // 公開日は、本番へ反映する日。公開がずれたら、公開の前に公開日と効力発生日を合わせる。
    // 効力発生日は、第1.0版に同意した会員との契約を変更する日で、変更の内容に合わせて周知の期間をおいて決める（翌日とは決めない）。
    // 公開日以後に同意した会員には、同意の時から適用する（概要の最後の文で示す）
    publishedAt: "2026-10-24",
    effectiveAt: "2026-10-31",
    summary:
      "同意と変更の手続（第1条・第17条）、登録の手続（第3条）、登録情報と第三者の情報（第4条）、本サービスの内容と当社の役割（第5条）、禁止行為（第10条）、個人情報の取扱い（第16条）の改定と、分離可能性（第19条）の追加。改定日以後に本規約に同意した会員には、同意の時から適用",
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
    // 公開日は、本番へ反映する日。ポリシーは公開日から適用するので、効力発生日も同じ日にする。公開がずれたら、公開の前に合わせる
    publishedAt: "2026-10-24",
    effectiveAt: "2026-10-24",
    summary:
      "外部サービスの事業者と、個人データが取り扱われる国の記載の訂正、利用規約への同意の記録の追記、利用目的の変更（利用状況の把握を統計的な形に限る記載を改め、分析、新しい機能・料金プランの企画、会員に応じたご案内、権利の保全などを追加。管理者による閲覧の目的もこれに合わせる）、開示等のご請求の手続の改定",
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

// 第1.1版以後の版への同意の記録が無い会員について、新しい投稿・応募などを同意のあとにしてもらう（利用を制限する）開始日（日本時間）。
// 制限は、版を上げることや asksAgreement とは別に、改定ごとに「制限するか・対象・開始日」を決める。この定数は第1.1版だけに使い、ほかの版には広げない。
// 開始日は、効力発生日と同じく周知の期間をおいて決める（第1.1版は公開日の1週間後で、効力発生日と同じ日）。公開がずれたら、公開の前に合わせる
export const TERMS_V1_1_RESTRICTION_STARTS_ON = "2026-10-31";

// 第1.1版の利用制限で「同意済み」として扱う記録の値。第1.1版から今の版までの、どれかの版への同意の記録があればよい。
// asksAgreement（帯で同意をお願いし直すか）とは分けて決める。将来の版で同意をお願いし直しても、
// 第1.1版以後に同意した会員に、この制限が再び始まらないようにするため
const termsV1_1Index = TERMS_REVISIONS.findIndex((revision) => revision.version === "1.1");
export const TERMS_V1_1_RESTRICTION_ACCEPTED_KEYS: string[] = TERMS_REVISIONS.slice(termsV1_1Index).map(
  (revision) => termsAgreementKey(revision.version)
);

// 第1.1版の利用制限が始まっているか。開始日の0時（日本時間）から始まる。
// サーバーの時計の時間帯（Vercel は UTC）に左右されないよう、日本時間の時刻として比べる。
// ふだんのアクセスのたびに今の時刻と比べるので、開始日のための定期実行や一括の処理は要らない
export function hasTermsV1_1RestrictionStarted(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(`${TERMS_V1_1_RESTRICTION_STARTS_ON}T00:00:00+09:00`).getTime();
}

// 第1.1版の利用制限の対象の会員か（日付は見ない）。管理者は対象外。
// agreedTermsKeys は、その会員の同意の記録の値（terms_agreements.termsVersion）の一覧
export function isTermsV1_1RestrictionTarget(isAdmin: boolean, agreedTermsKeys: string[]): boolean {
  if (isAdmin) return false;
  return !agreedTermsKeys.some((key) => TERMS_V1_1_RESTRICTION_ACCEPTED_KEYS.includes(key));
}
