import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { CreateRequestRequest, CreateRequestResponse } from "@/app/_types/requests";

export async function POST(request: NextRequest): Promise<NextResponse<CreateRequestResponse | { error: string }>>{
  // 認証チェック
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } ,
     { status: 401 });//  401 は Unauthorizedで、ログインしていない、または認証できていない状態
  }

  // リクエストボディを取得
  let body: CreateRequestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" } , 
      { status: 400 });  //  400 は Bad Requestで、リクエストの形式が正しくない状態
  }
    // 都道府県は1件以上必須。型上は number[] でも、外部からの生JSONは
  // 何が来るか分からないので Array.isArray でサーバー側でも検証する
  if (!Array.isArray(body.prefectureIds) || body.prefectureIds.length === 0) {
    return NextResponse.json({ error: "都道府県を1つ以上選択してください" },
      { status: 400 });
  }
  // DBに依頼待ちを保存
  try {
    const request_record = await prisma.requests.create({
      data: {
        // 旧カラムは「配列の先頭の県」で維持（旧コード・旧データとの互換用）
        prefectureId:       body.prefectureIds[0],
        // implicit m2m への紐付け。connect は「既存の prefectures 行と関連付ける」
        prefectures:        { connect: body.prefectureIds.map((id) => ({ id })) },        
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
      { error: "依頼待ちの作成に失敗しました" }
      , { status: 500 } 
      // 500 は Internal Server Error で、サーバー側で予期しないエラーが起きた状態。
    );
  }
}