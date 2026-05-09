import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import type { ProjectDetailResponse } from "@/app/_types/projects";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProjectDetailResponse>> {
  const { id } = await params;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: BigInt(id), deleted_at: null },
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

    const c = project.salesUser.company;

    return NextResponse.json({
      id: project.id.toString(),
      created_at: project.created_at.toISOString(),
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
    });

  } catch (e) {                                
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" } as never, { status: 500 });
  }                                            
}