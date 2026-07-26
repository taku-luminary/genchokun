import type { MatchCardState } from "@/app/_libs/reviewEligibility";
import type { ReviewRole } from "@/app/_libs/companyRatings";

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
};
