import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import type { HomeApiResponse, HomeProject, HomeRequest } from "@/app/_types/home";

// 「完了扱い」かどうかを判定（status が completed OR 期限切れ）
function isEffectivelyCompleted(status: string, endDate: string | null): boolean {
  if (status === "completed") return true;
  if (endDate && new Date(endDate) < new Date()) return true;
  return false;
}

export async function GET(): Promise<NextResponse<HomeApiResponse>> {
  // Promise< ... > → async関数なので、あとで返る
  // NextResponse< ... > → Next.jsのレスポンスを返す
  // HomeApiResponse → そのレスポンスの中身のJSONの型

  const [projects, requests] = await Promise.all([
    // Promise.all([A, B]) → AとBを同時にやって、両方終わったら結果を配列で返すJavaScript 標準の組み込みオブジェクト
    prisma.projects.findMany({
      where: { deleted_at: null },
      include: {
        prefecture: true,
        salesUser: { include: { company: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.requests.findMany({
      where: { deleted_at: null },
      include: {
        prefecture: true,
        contractorUser: { include: { company: true } },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const mappedProjects: HomeProject[] = projects.map((p) => ({
    id: p.id.toString(),
    created_at: p.created_at.toISOString(),
    prefecture: { name: p.prefecture.name },
    city: p.city,
    title: p.title,
    workStartDate: p.workStartDate?.toISOString() ?? null,
    workEndDate: p.workEndDate?.toISOString() ?? null,
    rewardYen: p.rewardYen === null ? null : Number(p.rewardYen),
    paymentCycle: p.paymentCycle,
    status: p.status,
    companyName: p.salesUser.company?.name ?? null,
  }));

  const mappedRequests: HomeRequest[] = requests.map((r) => ({
    id: r.id.toString(),
    created_at: r.created_at.toISOString(),
    prefecture: { name: r.prefecture.name },
    city: r.city,
    availableStartDate: r.availableStartDate?.toISOString() ?? null,
    availableEndDate: r.availableEndDate?.toISOString() ?? null,
    investigationSummary: r.investigationSummary,
    paymentCycle: r.paymentCycle,
    rewardMinYen: r.rewardMinYen === null ? null : Number(r.rewardMinYen),
    status: r.status,
    companyName: r.contractorUser.company?.name ?? null,
  }));

  // 募集中が上・完了（期限切れ含む）が下、同じグループ内は投稿順（新しい順）
  const sortCards = <T extends { status: string; workEndDate?: string | null; availableEndDate?: string | null; created_at: string }>(
    cards: T[]
  ): T[] =>
    cards.sort((a, b) => {
      const endDateA = "workEndDate" in a ? a.workEndDate ?? null : a.availableEndDate ?? null;
      const endDateB = "workEndDate" in b ? b.workEndDate ?? null : b.availableEndDate ?? null;
      const aCompleted = isEffectivelyCompleted(a.status, endDateA);
      const bCompleted = isEffectivelyCompleted(b.status, endDateB);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return NextResponse.json({
    projects: sortCards(mappedProjects),
    requests: sortCards(mappedRequests),
  });
}