import { NextRequest, NextResponse } from "next/server";
  import { prisma } from "@/app/_libs/prisma";
  import { getAuthUser } from "@/app/_libs/getAuthUser";
  import { findCompanyByUserId } from "@/app/_libs/requireCompany";
  import type { CreateProjectRequest, CreateProjectResponse } from "@/app/_types/projects";

  export async function POST(request: NextRequest): Promise<NextResponse<CreateProjectResponse | { error: string }>> {
    // 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });
    }

    // 自社情報が未登録なら投稿させない（本人特定できない取引を防ぐ）
    const company = await findCompanyByUserId(user.id);
    if (!company) {
      return NextResponse.json(
        { error: "この操作には自社情報の登録が必要です。" },
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const body: CreateProjectRequest = await request.json();

    // 報酬の検証・正規化:
    //   fixed(金額指定)         → 正の整数が必須
    //   negotiable(見積もり希望) → 金額は必ず null にする
    if (body.rewardType !== "fixed" && body.rewardType !== "negotiable") {
      return NextResponse.json({ error: "報酬の決め方が不正です" }, { status: 400 });
    }
    const isNegotiable = body.rewardType === "negotiable";
    if (
      !isNegotiable &&
      !(typeof body.rewardYen === "number" && Number.isFinite(body.rewardYen) && body.rewardYen > 0)
    ) {
      return NextResponse.json({ error: "報酬額を入力してください" }, { status: 400 });
    }
    const rewardYen = isNegotiable ? null : body.rewardYen ?? null;

    // DBに案件を保存
    const project = await prisma.projects.create({
      data: {
        prefectureId: body.prefectureId,
        city:                body.city ?? null,
        title:               body.title,
        summary: body.summary ?? null,
        note: body.note ?? null,
        workStartDate:       body.workStartDate ? new Date(body.workStartDate) : null,
        workEndDate:         body.workEndDate   ? new Date(body.workEndDate)   : null,
        rewardType:          body.rewardType,
        rewardYen,
        paymentCycle:        body.paymentCycle  ?? null,
        salesUserId:         user.id,
        status:              "open",
      },
    });

    return NextResponse.json({ id: project.id.toString() });
  }
