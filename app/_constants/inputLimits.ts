// 入力欄の上限。画面の入力欄（maxLength など）と API のチェックで同じ値を使い、
// 「画面では入力できたのに保存で弾かれる」食い違いを防ぐ。
// どの値も、既存の投稿・自社情報の最大の長さより十分大きく、通常の書き方で困らない長さにしている

// 案件・依頼待ちの自由記入欄（文字数）
export const POST_TEXT_MAX_LENGTH = {
  title: 100,
  city: 50,
  summary: 2000,
  note: 2000,
  paymentCycle: 100,
} as const;

// 応募のメッセージ（文字数）
export const APPLICATION_MESSAGE_MAX_LENGTH = 1000;

// 自社情報の自由記入欄（文字数）。施工体制・資格の欄は companyCredentials.ts の上限を使う
export const COMPANY_TEXT_MAX_LENGTH = {
  name: 100,
  city: 50,
  address: 200,
  representativeName: 50,
  websiteUrl: 500,
  description: 2000,
  contactPhone: 20,
  contactEmail: 254,
  contactLineId: 100,
  contactNote: 500,
} as const;

// トップの検索欄（文字数）。検索に使うのは、この中の先頭の数語だけ
export const SEARCH_QUERY_MAX_LENGTH = 100;

// 報酬金額の上限（円）。DB の整数の列に収まり、通常の工事・調査の金額より十分大きい値にしている
export const REWARD_YEN_MAX = 100_000_000;

// 従業員数の上限（人）
export const EMPLOYEE_COUNT_MAX = 100_000;

// 都道府県の ID の範囲（prefectures テーブルの id。1=北海道〜47=沖縄県）
export const PREFECTURE_ID_MIN = 1;
export const PREFECTURE_ID_MAX = 47;
