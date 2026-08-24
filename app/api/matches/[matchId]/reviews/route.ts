import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { isPastReviewTrigger } from "@/app/_libs/reviewEligibility";
import type { CreateReviewRequest, ReviewMutationResponse } from "@/app/_types/reviews";

// 1〜5の整数かどうかを判定するガード
function isValidRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
): Promise<NextResponse<ReviewMutationResponse>> {
  const { matchId } = await params;

  try {
    // 1. 認証
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. マッチを取得（予定日・両者の会社IDまで一緒に辿る）
    const match = await prisma.matches.findUnique({
      where: { id: BigInt(matchId) },
      include: {
        project: { select: { workEndDate: true } },
        request: { select: { availableEndDate: true } },
        salesUser: { include: { company: { select: { id: true } } } },
        contractorUser: { include: { company: { select: { id: true } } } },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "マッチが見つかりません" }, { status: 404 });
    }

    // 3. 当事者チェック（販売店側か工事店側か）。第三者には存在自体を隠す
    const isSalesSide = user.id === match.salesUserId;
    const isContractorSide = user.id === match.contractorUserId;
    if (!isSalesSide && !isContractorSide) {
      return NextResponse.json({ error: "マッチが見つかりません" }, { status: 404 });
    }

    // 4. マッチ成立済みか
    if (match.status !== "active") {
      return NextResponse.json({ error: "マッチが成立していません" }, { status: 409 });
    }

    // 5. レビューする側/される側の会社と、評価される側の役割を導出する
    const reviewerCompany = isSalesSide ? match.salesUser.company : match.contractorUser.company;
    const revieweeCompany = isSalesSide ? match.contractorUser.company : match.salesUser.company;
    const targetRole = isSalesSide ? "contractor" : "sales";

    if (!reviewerCompany) {
      return NextResponse.json({ error: "先に自社情報を登録してください" }, { status: 400 });
    }
    if (!revieweeCompany) {
      return NextResponse.json({ error: "相手企業の情報が登録されていません" }, { status: 400 });
    }

    // 6. 解禁日を過ぎているか（電気工事予定日 or マッチ成立+7日）
    const dateField = match.project?.workEndDate ?? match.request?.availableEndDate ?? null;
    if (!isPastReviewTrigger(dateField, match.createdAt)) {
      return NextResponse.json(
        { error: "電気工事の予定日を過ぎてからレビューできます" },
        { status: 409 },
      );
    }

    // 7. 二重投稿チェック（DBの @@unique と合わせた二重の安全確認）
    const existing = await prisma.reviews.findUnique({
      where: {
        matchId_reviewerCompanyId: {
          matchId: match.id,
          reviewerCompanyId: reviewerCompany.id,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "すでにレビュー済みです" }, { status: 409 });
    }

    // 8. 入力値の検証（総合＋5項目すべて 1〜5 の整数）
    const body: CreateReviewRequest = await request.json();
    const ratings = [
      body.item1Rating,
      body.item2Rating,
      body.item3Rating,
      body.item4Rating,
      body.item5Rating,
    ];
    if (!ratings.every(isValidRating)) {
      return NextResponse.json({ error: "評価は1〜5で入力してください" }, { status: 400 });
    }

    // 9. 保存
    await prisma.reviews.create({
      data: {
        matchId: match.id,
        reviewerCompanyId: reviewerCompany.id,
        revieweeCompanyId: revieweeCompany.id,
        targetRole,
        item1Rating: body.item1Rating,
        item2Rating: body.item2Rating,
        item3Rating: body.item3Rating,
        item4Rating: body.item4Rating,
        item5Rating: body.item5Rating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
