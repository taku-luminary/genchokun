import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { getCompanyOverallRating } from "@/app/_libs/companyRatings"; 
import { formatDate, formatJpDate } from "@/app/_utils/format"; 
import type {
  CompanyReviewItem,
  CompanyReviewsResponse,
  RelatedPost, 
} from "@/app/_types/reviews";

type ErrorResponse = { error: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<CompanyReviewsResponse | ErrorResponse>> {
  try {
    const { id } = await params;
    const companyId = BigInt(id);

    // 1. 企業の存在確認（名前は見出しに使う）
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    if (!company) {
      return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
    }

    // 2. 閲覧者の会社ID（未ログイン/会社未登録なら null）。isMine 判定に使う。
    const user = await getAuthUser();
    const myCompany = user
      ? await prisma.companies.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
      : null;

    // 3. この企業が受けた全レビュー（新しい順）。
    //    関連案件/依頼のタイトルと、投稿元企業名も一緒に辿る。
    const reviews = await prisma.reviews.findMany({
      where: { revieweeCompanyId: companyId },
      orderBy: { createdAt: "desc" },
      include: {
        reviewerCompany: { select: { id: true, name: true } },
        match: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                city: true,
                workStartDate: true,
                workEndDate: true,
                rewardYen: true,
                prefecture: { select: { name: true } },
              },
            },
            request: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                city: true,
                availableStartDate: true,
                availableEndDate: true,
                rewardMinYen: true,
                paymentCycle: true,
                prefectures: { select: { name: true } },
              },
            },
          },
        },
      },

    });

        // 関連する案件/依頼を、カード表示用の文字列に整形する（どちらか一方が入っている）
        const buildRelatedPost = (
          match: (typeof reviews)[number]["match"],
        ): RelatedPost | null => {
          const p = match.project;
          if (p) {
            return {
              kind: "project",
              id: p.id.toString(),
              title: p.title,
              date: formatDate(p.createdAt.toISOString()),
              location: `${p.prefecture.name}${p.city ? ` ${p.city}` : ""}`,
              schedule:
                p.workStartDate && p.workEndDate
                  ? `${formatJpDate(p.workStartDate.toISOString())}〜${formatJpDate(p.workEndDate.toISOString())}`
                  : "日程未定",
              amount: p.rewardYen ? `${p.rewardYen.toLocaleString()}円` : "—",
            };
          }
          const rq = match.request;
          if (rq) {
            const amount = rq.rewardMinYen
              ? rq.paymentCycle
                ? `${rq.paymentCycle}（${rq.rewardMinYen.toLocaleString()}円）`
                : `${rq.rewardMinYen.toLocaleString()}円`
              : rq.paymentCycle ?? "—";
            return {
              kind: "request",
              id: rq.id.toString(),
              title: rq.title,
              date: formatDate(rq.createdAt.toISOString()),
              location: `${rq.prefectures.map((pr) => pr.name).join("・")}${rq.city ? ` ${rq.city}` : ""}`,
              schedule:
                rq.availableStartDate && rq.availableEndDate
                  ? `${formatJpDate(rq.availableStartDate.toISOString())}〜${formatJpDate(rq.availableEndDate.toISOString())}`
                  : "日程未定",
              amount,
            };
          }
          return null;
        };
    
    // 4. 1件を表示用に整形する（overall は5項目の平均を小数1桁に丸める）
    const toItem = (r: (typeof reviews)[number]): CompanyReviewItem => {
      const overall =
        (r.item1Rating + r.item2Rating + r.item3Rating + r.item4Rating + r.item5Rating) / 5;
      return {
        id: r.id.toString(),
        targetRole: r.targetRole,
        item1Rating: r.item1Rating,
        item2Rating: r.item2Rating,
        item3Rating: r.item3Rating,
        item4Rating: r.item4Rating,
        item5Rating: r.item5Rating,
        overall: Math.round(overall * 10) / 10,
        relatedPost: buildRelatedPost(r.match), // ← 変更（旧 projectTitle 行を削除）
        reviewerCompanyName: r.reviewerCompany.name,
        createdAt: r.createdAt.toISOString(),
        isMine: myCompany ? r.reviewerCompany.id === myCompany.id : false,
      };
    };

    // 5. ロールごとに分ける
    const contractorReviews = reviews
      .filter((r) => r.targetRole === "contractor")
      .map(toItem);
    const salesReviews = reviews.filter((r) => r.targetRole === "sales").map(toItem);

    // 6. 上部の総合評価（工事店/販売店の合算）
    const overall = await getCompanyOverallRating(id);

    return NextResponse.json({
      companyName: company.name,
      overall,
      contractor: { count: contractorReviews.length, reviews: contractorReviews },
      sales: { count: salesReviews.length, reviews: salesReviews },
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
