import { NextRequest, NextResponse } from "next/server";
  import { prisma } from "@/app/_libs/prisma";
  import { getAuthUser } from "@/app/_libs/getAuthUser";
  import type { CreateProjectRequest, CreateProjectResponse } from "@/app/_types/projects";

  export async function POST(request: NextRequest): Promise<NextResponse<CreateProjectResponse>> {
    // 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });
    }

    // リクエストボディを取得
    const body: CreateProjectRequest = await request.json();

    // DBに案件を保存
    const project = await prisma.projects.create({
      data: {
        prefectureId: body.prefectureId,
        city:                body.city ?? null,
        title:               body.title,
        investigationSummary: body.investigationSummary ?? null,
        investigationDetails: body.investigationDetails ?? null,
        workStartDate:       body.workStartDate ? new Date(body.workStartDate) : null,
        workEndDate:         body.workEndDate   ? new Date(body.workEndDate)   : null,
        rewardYen:           body.rewardYen     ?? null,
        paymentCycle:        body.paymentCycle  ?? null,
        salesUserId:         user.id,
        status:              "open",
        created_at:          new Date(),
        updated_at:          new Date(),
      },
    });

    return NextResponse.json({ id: project.id.toString() });
  }