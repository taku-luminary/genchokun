import type { MatchCardState } from "@/app/_libs/reviewEligibility";
import type { ReviewRole, CompanyRatingSummary } from "@/app/_libs/companyRatings";

// レビューの点数。投稿・編集の送信内容と、保存済みの値で共通に使う。
export type ReviewInput = {
  item1Rating: number; // 項目別 1〜5（意味は targetRole で変わる）
  item2Rating: number;
  item3Rating: number;
  item4Rating: number;
  item5Rating: number;
};


// POST /api/matches/[matchId]/reviews のリクエスト型（= 点数そのもの）
export type CreateReviewRequest = ReviewInput;

// PUT /api/reviews/[id] のリクエスト型（新規と同じ入力）
export type UpdateReviewRequest = ReviewInput;

// 作成・編集・削除の共通レスポンス型
export type ReviewMutationResponse = { success: true } | { error: string };

// 詳細ページのマッチカードに渡す、レビュー関連の情報一式。
// null のときは「レビューの流れに乗らない（従来通りの連絡先カード等の表示）」。
export type ReviewCardInfo = {
  cardState: MatchCardState; // "matched" | "needsReview" | "reviewed"
  matchId: string; // レビューの投稿先
  targetRole: ReviewRole; // 表示する評価項目セット（工事店用/販売店用）
  // 投稿済みなら中身＋編集用の review id、未投稿なら null
  myReview: (ReviewInput & { id: string }) | null;
  // 評価する相手企業（表示名＋企業ページへのリンク用）。会社未登録など例外時は null
  partnerCompany: { id: string; name: string } | null;
};


// ── 企業レビュー一覧ページ用 ──────────────────────────────

// 関連する案件/依頼の要約（レビュー一覧カードに表示する）。
// project（案件）か request（依頼）かで詳細ページのURLが変わるため kind を持つ。
export type RelatedPost = {
  kind: "project" | "request"; // 詳細ページのURL切替に使う
  id: string;                  // 詳細ページのリンク用
  title: string;
  date: string;                // 投稿日 "2026.01.29"
  location: string;            // "東京都 渋谷区"
  schedule: string;            // "1月10日(金)〜1月20日(月)" または "日程未定"
  amount: string;              // "50,000円" など。無ければ "—"
};

// GET /api/companies/[id]/reviews の1件分。
// ReviewInput（5項目の点数）に、表示用の付随情報を足したもの。
export type CompanyReviewItem = ReviewInput & {
  id: string;
  targetRole: ReviewRole;      // 工事店/販売店どちらへの評価か
  overall: number;             // 5項目の平均（小数1桁）。表示用
  relatedPost: RelatedPost | null; // ← 変更: projectTitle を差し替え（削除済み案件なら null）
  reviewerCompanyName: string; // レビューを書いた企業名
  createdAt: string;           // ISO文字列
  isMine: boolean;             // 閲覧者自身が書いたレビューか（編集/削除ボタン用）
};

// ロールごとの一覧（件数＋レビュー）。平均はページ上部の overall に一本化したので持たない。
export type CompanyReviewsByRole = {
  count: number;
  reviews: CompanyReviewItem[];
};

// GET /api/companies/[id]/reviews のレスポンス
export type CompanyReviewsResponse = {
  companyName: string;
  overall: CompanyRatingSummary | null; 
  contractor: CompanyReviewsByRole;
  sales: CompanyReviewsByRole;
};
