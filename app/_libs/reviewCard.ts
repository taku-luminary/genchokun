import { prisma } from "@/app/_libs/prisma";
import {
  resolveMatchCardState,
  resolveReviewTargetRole,
} from "@/app/_libs/reviewEligibility";
import type { ReviewCardInfo } from "@/app/_types/reviews";

// 詳細ページのマッチカードに渡す ReviewCardInfo を組み立てる共通処理。
// レビューの流れに乗らない場合（未ログイン / 当事者でない / 会社未登録 / マッチ未成立）は null を返す。
export async function buildReviewCardInfo(params: {
  currentUserId: string | null;
  match: {
    id: bigint;
    status: string;
    createdAt: Date;
    salesUserId: string;
    contractorUserId: string;
  } | null;
  dateField: Date | null; // workEndDate または availableEndDate
}): Promise<ReviewCardInfo | null> {
  const { currentUserId, match, dateField } = params;
  if (!currentUserId || !match) return null;

  // 相手をどの役割として評価するか（このマッチの当事者でなければ null）
  const targetRole = resolveReviewTargetRole({
    salesUserId: match.salesUserId,
    contractorUserId: match.contractorUserId,
    currentUserId,
  });
  if (!targetRole) return null;

  // レビューする側 = ログイン中ユーザーの会社。未登録ならレビューの流れに乗せない
  const myCompany = await prisma.companies.findUnique({
    where: { userId: currentUserId },
    select: { id: true },
  });
  if (!myCompany) return null;

  // このマッチに対する自分の会社のレビュー（あれば中身も取得）
  const myReview = await prisma.reviews.findUnique({
    where: {
      matchId_reviewerCompanyId: {
        matchId: match.id,
        reviewerCompanyId: myCompany.id,
      },
    },
    select: {
      id: true,
      item1Rating: true,
      item2Rating: true,
      item3Rating: true,
      item4Rating: true,
      item5Rating: true,
    },
  });

  const cardState = resolveMatchCardState({
    matchStatus: match.status,
    dateField,
    matchCreatedAt: match.createdAt,
    alreadyReviewed: myReview !== null,
  });
  if (cardState === null) return null; // マッチ未成立など → 従来通りの表示

  // 評価する相手（自分が販売店なら相手は工事店、自分が工事店なら相手は販売店）の会社情報。
  // 企業名の表示・企業ページへのリンクに使う。
  const partnerUserId =
    targetRole === "contractor" ? match.contractorUserId : match.salesUserId;
  const partnerCompany = await prisma.companies.findUnique({
    where: { userId: partnerUserId },
    select: { id: true, name: true },
  });

  return {
    cardState,
    matchId: match.id.toString(),
    targetRole,
    myReview: myReview
      ? {
          id: myReview.id.toString(),
          item1Rating: myReview.item1Rating,
          item2Rating: myReview.item2Rating,
          item3Rating: myReview.item3Rating,
          item4Rating: myReview.item4Rating,
          item5Rating: myReview.item5Rating,
        }
      : null,
    partnerCompany: partnerCompany
      ? { id: partnerCompany.id.toString(), name: partnerCompany.name }
      : null,
  };
}
