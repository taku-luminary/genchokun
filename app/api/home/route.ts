import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import type { HomeApiResponse, HomeProject, HomeRequest } from "@/app/_types/home";

// 「完了扱い」かどうかを判定（status が completed OR 期限切れ）
function isEffectivelyCompleted(status: string, endDate: string | null): boolean {
  // : booleanの意味は、この関数は、最後に必ず true か false を返します。
  if (status === "completed") return true;
  if (endDate && new Date(endDate) < new Date()) return true;
  // 終了日があり、終了日が今より過去なら、true。status が recruiting のままでも「完了扱い」にしている
  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse<HomeApiResponse>> {  // Promise< ... > → async関数なので、あとで返る
  // NextResponse< ... > → Next.jsのレスポンスを返す
  // HomeApiResponse → そのレスポンスの中身のJSONの型

  // タブごとに独立したページ番号を受け取る
  const { searchParams } = new URL(request.url);
  const projectsPage = Number(searchParams.get("projectsPage") ?? "1");
  const requestsPage = Number(searchParams.get("requestsPage") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  
  const [projects, totalProjects, requests, totalRequests] = await Promise.all([
    // Promise.all([A, B]) → AとBを同時にやって、両方終わったら結果を配列で返すJavaScript 標準の組み込みオブジェクト

      prisma.projects.findMany({
        where: { deleted_at: null },
        include: {
          prefecture: true,
          salesUser: { include: { company: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (projectsPage - 1) * limit, // 先頭から何件スキップするか
        take: limit,  // 何件取得するか
      }),

      prisma.projects.count({ where: { deleted_at: null } }), // 案件の総件数
      
      prisma.requests.findMany({
        where: { deleted_at: null },
        include: {
          prefecture: true,
          contractorUser: { include: { company: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (requestsPage - 1) * limit,
        take: limit,
      }),
      
      prisma.requests.count({ where: { deleted_at: null } }), // 依頼待ちの総件数
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
    title: r.title, // 追加
    availableStartDate: r.availableStartDate?.toISOString() ?? null,
    availableEndDate: r.availableEndDate?.toISOString() ?? null,
    investigationSummary: r.investigationSummary,
    paymentCycle: r.paymentCycle,
    rewardMinYen: r.rewardMinYen === null ? null : Number(r.rewardMinYen),
    status: r.status,
    companyName: r.contractorUser.company?.name ?? null,
  }));

  // 募集中が上・完了（期限切れ含む）が下、同じグループ内は投稿順（新しい順）
  const sortCards = <T extends { status: string; workEndDate?: string | null; availableEndDate?: string | null; created_at: string }>
  (cards: T[]): T[] =>
    //sortCards に渡された引数 mappedProjects の型を見て、TypeScript が T を HomeProject だと推論してくれる
    cards.sort((a, b) => {
    //省略しないと、const sortCards = (cards) => {return cards.sort((a, b) => {...});};
    // .sort() の比較関数では、return で数字を返す。
    // return の結果がマイナスなら a が前、プラスなら b が前、0 なら順番はそのまま扱いになる。
    // return 以降には、最終的に数字を返す処理なら書ける。ただし、その数字が「a と b の順番を正しく表すルール」になっていないと、期待した並び替えにはならない。
      const endDateA = "workEndDate" in a ? a.workEndDate ?? null : a.availableEndDate ?? null;
      // 上記は→と同じconst endDateA = (() => { if ("workEndDate" in a) { return a.workEndDate ?? null; } else { return a.availableEndDate ?? null; } })();
      const endDateB = "workEndDate" in b ? b.workEndDate ?? null : b.availableEndDate ?? null;
      const aCompleted = isEffectivelyCompleted(a.status, endDateA);
      const bCompleted = isEffectivelyCompleted(b.status, endDateB);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const response: HomeApiResponse = {
      projects: sortCards(mappedProjects),
      requests: sortCards(mappedRequests),
      totalProjects,  
      totalRequests,  
    };
  
    return NextResponse.json(response);
}