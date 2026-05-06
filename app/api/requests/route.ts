import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { CreateRequestRequest, CreateRequestResponse } from "@/app/_types/requests";

export async function POST(request: NextRequest): Promise<NextResponse<CreateRequestResponse | { error: string }>>{
  // 認証チェック
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } ,
     { status: 401 });
  }

  // リクエストボディを取得
  let body: CreateRequestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" } , { status: 400 });
  }
  // DBに依頼待ちを保存
  try {
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
  // 実際に返るレスポンスのイメージ（例）
  // {
  //   status: 200,
  //   ok: true,
  //   body: { id: "15" }
  // }
} catch {
  return NextResponse.json(
    { error: "依頼待ちの作成に失敗しました" } as never,
    { status: 500 }
  );
}
}