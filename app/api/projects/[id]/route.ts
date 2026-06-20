import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import type { ProjectDetailResponse, UpdateProjectRequest } from "@/app/_types/projects";
import { getAuthUser } from "@/app/_libs/getAuthUser";



export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProjectDetailResponse>> {
  const { id } = await params;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        prefecture: true,
        salesUser: {
          include: {
            company: {
              include: { prefecture: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" } as never, { status: 404 });
    }

    // ▼ 変更: hasApplied(boolean) ではなく myMatchStatus(4値) を計算する。
    //         pending/active/rejected の3状態のいずれかが見つかればその status を、
    //         どれも無ければ null（未応募）を返す。
    //         cancelled は対象外（今は使っていないが、将来「自主取下げ」用に予約済み）。
    const user = await getAuthUser();
    let myMatchStatus: ProjectDetailResponse["myMatchStatus"] = null;
    // ▼ 追加: ログイン中ユーザーがこの案件の掲載者本人かどうか。
    //         未ログインなら false。
    const isMyProject = user ? user.id === project.salesUserId : false;
    if (user) {
      const existing = await prisma.matches.findFirst({
        where: {
          projectId: project.id,
          contractorUserId: user.id,
          status: { in: ["pending", "active", "rejected"] },
        },
        select: { status: true },
      });
      // Prisma の型は match_status 全体 (pending/active/rejected/cancelled) を返すが、
      // 上の where 句で cancelled は除外している。型ガードで明示的に絞り込んで
      // myMatchStatus の型 ("pending" | "active" | "rejected" | null) と整合させる。
      if (existing && existing.status !== "cancelled") {
        myMatchStatus = existing.status;
      }
    }

    // ▼ 追加: この案件への「有効な応募」の件数を数える。
    //   pending（決定待ち）・active（成立）を応募ありとみなす。
    //   1件でもあれば、応募者にとって条件が確定し始めているため編集不可にする。
    const applicationCount = await prisma.matches.count({
      where: {
        projectId: project.id,
        status: { in: ["pending", "active"] },
      },
    });

    // ▼ 追加: 編集可否。投稿者本人 && 募集中 && 応募ゼロ のときだけ true。
    const isEditable =
      isMyProject && project.status === "open" && applicationCount === 0;

    const c = project.salesUser.company;

    return NextResponse.json({
      id: project.id.toString(),
      createdAt: project.createdAt.toISOString(),
      prefecture: { name: project.prefecture.name },
      // ▼ 追加: 編集フォームの初期値用
      prefectureId: project.prefectureId,      city: project.city,
      title: project.title,
      investigationSummary: project.investigationSummary,
      investigationDetails: project.investigationDetails,
      workStartDate: project.workStartDate?.toISOString() ?? null,
      workEndDate: project.workEndDate?.toISOString() ?? null,
      rewardYen: project.rewardYen === null ? null : Number(project.rewardYen),
      paymentCycle: project.paymentCycle,
      status: project.status,
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
      myMatchStatus,
      // ▼ 追加: 掲載者本人なら true。画面側で「管理ページへの誘導バナー」表示に使う。
      isMyProject,
      // ▼ 追加: 自分がマッチ成立した（active）ときだけ、販売店の連絡先を返す。
      //         pending/rejected/null の場合は null。
      salesContact:
        myMatchStatus === "active" && c
          ? {
              phone: c.contactPhone,
              email: c.contactEmail,
              lineId: c.contactLineId,
              note: c.contactNote,
            }
          : null,
      // ▼ 追加: 編集/削除ボタンの表示制御用（サーバー側でも PUT/DELETE 時に再チェックする）
      isEditable,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" } as never, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: true } | { error: string }>> {
  const { id } = await params;

  try {
    // 1. ログイン確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. 所有者＋存在確認。
    //    where に salesUserId: user.id を入れることで「本人の案件」だけがヒットする。
    //    他人の案件や削除済み(deletedAt)は見つからず 404 になる。
    const project = await prisma.projects.findFirst({
      where: { id: BigInt(id), salesUserId: user.id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 3. 編集可否をサーバー側で再チェック（表示用 isEditable とは別に必ず確認する）。
    //    募集中(open)でなければ編集不可。
    if (project.status !== "open") {
      return NextResponse.json(
        { error: "この案件は編集できません" },
        { status: 409 }
      );
    }
    //    有効な応募(pending/active)が1件でもあれば編集不可。
    const applicationCount = await prisma.matches.count({
      where: {
        projectId: project.id,
        status: { in: ["pending", "active"] },
      },
    });
    if (applicationCount > 0) {
      return NextResponse.json(
        { error: "応募が来ているため編集できません" },
        { status: 409 }
      );
    }

    // 4. 受け取った内容で更新。正規化ルールは新規作成API(/api/projects)と同じ。
    //    任意項目は ?? null、日付は文字列→Date に変換する。
    const body: UpdateProjectRequest = await request.json();
    await prisma.projects.update({
      where: { id: project.id },
      data: {
        prefectureId: body.prefectureId,
        city: body.city ?? null,
        title: body.title,
        investigationSummary: body.investigationSummary ?? null,
        investigationDetails: body.investigationDetails ?? null,
        workStartDate: body.workStartDate ? new Date(body.workStartDate) : null,
        workEndDate: body.workEndDate ? new Date(body.workEndDate) : null,
        rewardYen: body.rewardYen ?? null,
        paymentCycle: body.paymentCycle ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}