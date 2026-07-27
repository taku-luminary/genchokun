import type { ReviewRole } from "@/app/_libs/companyRatings";

// 現調予定日が未設定のとき、マッチ成立から何日後にレビューを解禁するか
export const REVIEW_FALLBACK_DAYS = 7;

/**
 * レビュー解禁日を求める（純粋関数・DBアクセスなし）。
 * 予定日(workEndDate / availableEndDate)があればその日、
 * 無ければ「マッチ成立日 + 7日」を解禁日とする。
 */
export function getReviewTriggerDate(
  dateField: Date | null,
  matchCreatedAt: Date,
): Date {
  if (dateField) return dateField;
  const fallback = new Date(matchCreatedAt);
  fallback.setDate(fallback.getDate() + REVIEW_FALLBACK_DAYS);
  return fallback;
}

/** 今が解禁日を過ぎているか（＝レビューできる時期か） */
export function isPastReviewTrigger(
  dateField: Date | null,
  matchCreatedAt: Date,
  now: Date = new Date(),
): boolean {
  return now >= getReviewTriggerDate(dateField, matchCreatedAt);
}

// マッチカードの3状態。null は「レビューの流れに乗らない＝従来通りの表示」
export type MatchCardState = "matched" | "needsReview" | "reviewed";

/**
 * マッチカードの状態を決める（純粋関数）。
 * DBアクセスはしないので、「既にレビュー済みか(alreadyReviewed)」は
 * 呼び出し側（API）が調べて渡す。
 */
export function resolveMatchCardState(params: {
  matchStatus: string;       // "active" のときだけレビューの流れに入る
  dateField: Date | null;    // workEndDate または availableEndDate
  matchCreatedAt: Date;
  alreadyReviewed: boolean;  // このユーザーがこのマッチを既にレビュー済みか
  now?: Date;
}): MatchCardState | null {
  const { matchStatus, dateField, matchCreatedAt, alreadyReviewed, now } = params;

  if (matchStatus !== "active") return null;   // まだマッチ成立していない等 → 通常表示
  if (alreadyReviewed) return "reviewed";      // 状態③：投稿済み
  if (isPastReviewTrigger(dateField, matchCreatedAt, now)) return "needsReview"; // 状態②
  return "matched";                            // 状態①：連絡先案内
}

/**
 * 現在のユーザーが「相手をどの役割として評価するか」を決める（純粋関数）。
 * 自分が販売店側 → 相手は工事店 → "contractor"
 * 自分が工事店側 → 相手は販売店 → "sales"
 * このマッチの当事者でなければ null。
 */
export function resolveReviewTargetRole(params: {
  salesUserId: string;
  contractorUserId: string;
  currentUserId: string;
}): ReviewRole | null {
  const { salesUserId, contractorUserId, currentUserId } = params;
  if (currentUserId === salesUserId) return "contractor";
  if (currentUserId === contractorUserId) return "sales";
  return null;
}
