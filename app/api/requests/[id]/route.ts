import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { RequestDetailResponse } from "@/app/_types/requests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RequestDetailResponse>> {
  const { id } = await params;

  try {
    const request = await prisma.requests.findUnique({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        prefecture: true,
        contractorUser: {
          include: {
            company: {
              include: { prefecture: true },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "依頼が見つかりません" } as never, { status: 404 });
    }
    
    // この依頼に既にマッチが成立しているかを判定する
    // matches.requestId は @unique のため、依頼ごとに最大1件しか存在しない
    // 1回のクエリで取得し、その結果から
    //   - isMatched (誰かが応募してマッチ済みか)
    //   - hasApplied (自分が応募済みか)
    // の両方を導出する
    const matchedAny = await prisma.matches.findFirst({
      where: {
        requestId: request.id,
        status: { in: ["pending", "active"] },
      },
      select: { salesUserId: true },
    });
    const isMatched = matchedAny !== null;


    // 追加: ログイン中ユーザーが既にこの依頼に応募(=マッチング)済みかを判定する
    // - 依頼に応募するのは「販売店」なので、salesUserId に user.id を入れて検索する
    // - status は "pending" または "active" の場合に応募済み扱い
    //   ("rejected" / "cancelled" は今後の拡張用。今は active のみ作成される)
    const user = await getAuthUser();
    let hasApplied = false;
    if (user) {
      const existing = await prisma.matches.findFirst({
        where: {
          requestId: request.id,
          salesUserId: user.id,
          status: { in: ["pending", "active"] },
        },
      });
      hasApplied = existing !== null;
    }


    const c = request.contractorUser.company;

    return NextResponse.json({
      id: request.id.toString(),
      createdAt: request.createdAt.toISOString(),
      prefecture: { name: request.prefecture.name },
      city: request.city,
      title: request.title,
      investigationSummary: request.investigationSummary,
      investigationDetails: request.investigationDetails,
      availableStartDate: request.availableStartDate?.toISOString() ?? null,
      availableEndDate: request.availableEndDate?.toISOString() ?? null,
      rewardMinYen: request.rewardMinYen === null ? null : Number(request.rewardMinYen),
      paymentCycle: request.paymentCycle,
      status: request.status,
      company: c
        ? {
            name: c.name,
            prefecture: c.prefecture.name,
            city: c.city,
            address: c.address,
            representativeName: c.representativeName,
            employeeCount: c.employeeCount,
            websiteUrl: c.websiteUrl,
            description: c.description,
          }
        : null,
      hasApplied,
      isMatched, 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" } as never, { status: 500 });
  }
}