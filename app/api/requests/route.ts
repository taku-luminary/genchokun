import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { CreateRequestRequest, CreateRequestResponse } from "@/app/_types/requests";

export async function POST(request: NextRequest): Promise<NextResponse<CreateRequestResponse>> {
  // 認証チェック
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });
  }

  // リクエストボディを取得
  const body: CreateRequestRequest = await request.json();

  // DBに依頼待ちを保存
  const request_record = await prisma.requests.create({
    data: {
      prefectureId:       body.prefectureId,
      city:               body.city               ?? null,
      title:              body.title,
      investigationSummary: body.investigationSummary ?? null,
      investigationDetails: body.investigationDetails ?? null,
      availableStartDate: body.availableStartDate ? new Date(body.availableStartDate) : null,
      availableEndDate:   body.availableEndDate   ? new Date(body.availableEndDate)   : null,
      rewardMinYen:       body.rewardMinYen       ?? null,
      paymentCycle:       body.paymentCycle       ?? null,
      contractorUserId:   user.id,
      status:             "open",
      created_at:         new Date(),
      updated_at:         new Date(),
    },
  });

  return NextResponse.json({ id: request_record.id.toString() });
}