import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
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
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" } as never, { status: 500 });
  }
}
