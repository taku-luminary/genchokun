import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { findCompanyByUserId } from "@/app/_libs/requireCompany";
import { isTermsAgreementRequired, termsAgreementRequiredResponse } from "@/app/_libs/requireTermsAgreement";
import type { CreateRequestRequest, CreateRequestResponse } from "@/app/_types/requests";
import { getRequestInputError, getRewardYenError } from "@/app/_utils/inputValidation";

export async function POST(request: NextRequest): Promise<NextResponse<CreateRequestResponse | { error: string }>>{
  // 認証チェック
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } ,
     { status: 401 });//  401 は Unauthorizedで、ログインしていない、または認証できていない状態
  }

  // 第1.1版の利用制限：新しい依頼待ちの投稿は、利用規約への同意のあとにできる（開始日の前は制限しない）
  if (await isTermsAgreementRequired(user.id)) {
    return termsAgreementRequiredResponse();
  }

  // 自社情報が未登録なら依頼を出させない（本人特定できない取引を防ぐ）
  const company = await findCompanyByUserId(user.id);
  if (!company) {
    return NextResponse.json(
      { error: "この操作には自社情報の登録が必要です。" },
      { status: 403 }
    );
  }

  // リクエストボディを取得
  let body: CreateRequestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" } , 
      { status: 400 });  //  400 は Bad Requestで、リクエストの形式が正しくない状態
  }
  // 型と文字数のチェック。都道府県（1件以上必須）も、型上は number[] でも外部からの生JSONは
  // 何が来るか分からないので、配列であることと中身が都道府県の ID であることをサーバー側でも検証する
  const inputError = getRequestInputError(body);
  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: 400 });
  }

  // 報酬の決め方を検証。fixed=報酬金額(正の数)が必須 / negotiable=金額は必ず null に落とす
  if (body.rewardType !== "fixed" && body.rewardType !== "negotiable") {
    return NextResponse.json({ error: "報酬金額の決め方が不正です" }, { status: 400 });
  }
  const isNegotiable = body.rewardType === "negotiable";
  const rewardError = isNegotiable ? null : getRewardYenError(body.rewardMinYen);
  if (rewardError) {
    return NextResponse.json({ error: rewardError }, { status: 400 });
  }
  const rewardMinYen = isNegotiable ? null : body.rewardMinYen ?? null;

  
  // DBに依頼待ちを保存
  try {
    const request_record = await prisma.requests.create({
      data: {
        // implicit m2m への紐付け。connect は「既存の prefectures 行と関連付ける」
        prefectures:        { connect: body.prefectureIds.map((id) => ({ id })) },        
        city:               body.city               ?? null,
        title:              body.title,
        summary: body.summary ?? null,
        note: body.note ?? null,
        availableStartDate: body.availableStartDate ? new Date(body.availableStartDate) : null,
        availableEndDate:   body.availableEndDate   ? new Date(body.availableEndDate)   : null,
        rewardType:         body.rewardType,
        rewardMinYen:       rewardMinYen,
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