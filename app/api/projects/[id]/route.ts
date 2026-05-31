import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import type { ProjectDetailResponse } from "@/app/_types/projects";
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

    const c = project.salesUser.company;

    return NextResponse.json({
      id: project.id.toString(),
      createdAt: project.createdAt.toISOString(),
      prefecture: { name: project.prefecture.name },
      city: project.city,
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
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" } as never, { status: 500 });
  }
}
