import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { UpdateReviewRequest, ReviewMutationResponse } from "@/app/_types/reviews";

// 1〜5の整数かどうか（作成APIと同じ検証。小さいので各ルートに置く）
function isValidRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

// 「自分の会社が投稿したレビュー」だけを id で1件引く。
// 他人のレビューや存在しないidは null（→ 呼び出し側で404）になる。
async function findMyReview(userId: string, reviewId: string) {
  const myCompany = await prisma.companies.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!myCompany) return null;

  return prisma.reviews.findFirst({
    where: { id: BigInt(reviewId), reviewerCompanyId: myCompany.id },
    select: { id: true },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ReviewMutationResponse>> {
  const { id } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 所有権チェック（自分の会社のレビュー以外は 404）
    const review = await findMyReview(user.id, id);
    if (!review) {
      return NextResponse.json({ error: "レビューが見つかりません" }, { status: 404 });
    }

    // 入力検証（総合＋5項目すべて 1〜5）
    const body: UpdateReviewRequest = await request.json();
    const ratings = [
      body.overallRating,
      body.item1Rating,
      body.item2Rating,
      body.item3Rating,
      body.item4Rating,
      body.item5Rating,
    ];
    if (!ratings.every(isValidRating)) {
      return NextResponse.json({ error: "評価は1〜5で入力してください" }, { status: 400 });
    }

    // 点数だけ更新（誰が誰を・どの役割か等は変更させない）
    await prisma.reviews.update({
      where: { id: review.id },
      data: {
        overallRating: body.overallRating,
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
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ReviewMutationResponse>> {
  const { id } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const review = await findMyReview(user.id, id);
    if (!review) {
      return NextResponse.json({ error: "レビューが見つかりません" }, { status: 404 });
    }

    // レビューは末端データなので物理削除
    await prisma.reviews.delete({ where: { id: review.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
