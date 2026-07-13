import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { MypageApiResponse } from "@/app/_types/mypage";

export async function GET(): Promise<NextResponse<MypageApiResponse>> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" } as never, { status: 401 });
  }

  // ▼ 変更: applicationCount の count クエリを廃止し、「応募した案件」一覧そのものを
  //         取得して、件数は配列の長さから数える方式にした。
  //         旧実装 matches.count({ where: { contractorUserId: user.id } }) には
  //         「自分の request に届いたマッチ(これも contractorUserId=自分)」を誤って数え、
  //         「request への自分の応募(こちらは salesUserId=自分)」を数え漏らすバグがあった。
  const [todoCount, projects, requests, appliedProjectMatches, appliedRequestMatches] =
    await Promise.all([
      prisma.matches.count({
        where: { salesUserId: user.id, status: "pending" },
      }),
      prisma.projects.findMany({
        where: { salesUserId: user.id, deletedAt: null },
        include: { prefecture: true, matches: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.requests.findMany({
        where: { contractorUserId: user.id, deletedAt: null },
        include: { prefectures: { orderBy: { id: "asc" } }, match: true },
        orderBy: { createdAt: "desc" },
      }),
      // ▼ 追加: 自分が工事店として応募した project のマッチ一覧。
      //         matches は projectId / requestId のどちらかしか入らないので、
      //         projectId: { not: null } で「project への応募」だけに絞る。
      prisma.matches.findMany({
        where: {
          contractorUserId: user.id,
          projectId: { not: null },
          project: { deletedAt: null }, // 論理削除された案件は出さない
        },
        include: {
          project: {
            include: {
              prefecture: true,
              // 発注者(販売店)の会社名をカードに出すために辿る
              salesUser: { include: { company: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // ▼ 追加: 自分が販売店として応募した request のマッチ一覧
      prisma.matches.findMany({
        where: {
          salesUserId: user.id,
          requestId: { not: null },
          request: { deletedAt: null },
        },
        include: {
          request: {
            include: {
              prefectures: { orderBy: { id: "asc" } },
              contractorUser: { include: { company: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const response: MypageApiResponse = {
    stats: {
      // 掲載した案件 = 掲載した工事案件 + 掲載したお仕事待ち の合算
      postedCount: projects.length + requests.length,
      // 応募した案件 = 工事案件への応募 + お仕事待ちへの応募 の合算
      appliedCount: appliedProjectMatches.length + appliedRequestMatches.length,
      todoCount,
    },
    projects: projects.map((p) => ({
      id: p.id.toString(),
      createdAt: p.createdAt.toISOString(),
      prefecture: { name: p.prefecture.name },
      city: p.city,
      title: p.title,
      workStartDate: p.workStartDate?.toISOString() ?? null,
      workEndDate: p.workEndDate?.toISOString() ?? null,
      investigationSummary: p.investigationSummary,
      paymentCycle: p.paymentCycle,
      rewardYen: p.rewardYen === null ? null : Number(p.rewardYen),
      status: p.status,
      companyName: null,                                   // ← 追加（自分の投稿なので null）
      matches: p.matches.map((m) => ({ status: m.status })),
    })),
    requests: requests.map((r) => ({
      id: r.id.toString(),
      createdAt: r.createdAt.toISOString(),
      prefectures: r.prefectures.map((p) => ({ name: p.name })),
      city: r.city,
      title: r.title,                                      // ← 追加（漏れていた）
      availableStartDate: r.availableStartDate?.toISOString() ?? null,
      availableEndDate: r.availableEndDate?.toISOString() ?? null,
      investigationSummary: r.investigationSummary,
      paymentCycle: r.paymentCycle,
      rewardMinYen: r.rewardMinYen === null ? null : Number(r.rewardMinYen),
      status: r.status,
      companyName: null,                                   // ← 追加
      match: r.match ? { status: r.match.status } : null,
    })),
    // ▼ 追加: 応募した project 一覧。
    //         where 句で projectId ≠ null に絞っているので m.project は必ず存在するが、
    //         Prisma の型上は null がありうるため、flatMap で「null なら空配列(=スキップ)、
    //         あれば1件の配列」を返して型安全に除外している。
    appliedProjects: appliedProjectMatches.flatMap((m) =>
      m.project
        ? [
            {
              matchId: m.id.toString(),
              myStatus: m.status,
              project: {
                id: m.project.id.toString(),
                createdAt: m.project.createdAt.toISOString(),
                prefecture: { name: m.project.prefecture.name },
                city: m.project.city,
                title: m.project.title,
                workStartDate: m.project.workStartDate?.toISOString() ?? null,
                workEndDate: m.project.workEndDate?.toISOString() ?? null,
                rewardYen: m.project.rewardYen === null ? null : Number(m.project.rewardYen),
                paymentCycle: m.project.paymentCycle,
                status: m.project.status,
                companyName: m.project.salesUser.company?.name ?? null,
              },
            },
          ]
        : []
    ),
    // ▼ 追加: 応募した request 一覧（構造は appliedProjects と同じ）
    appliedRequests: appliedRequestMatches.flatMap((m) =>
      m.request
        ? [
            {
              matchId: m.id.toString(),
              myStatus: m.status,
              request: {
                id: m.request.id.toString(),
                createdAt: m.request.createdAt.toISOString(),
                prefectures: m.request.prefectures.map((p) => ({ name: p.name })),
                city: m.request.city,
                title: m.request.title,
                availableStartDate: m.request.availableStartDate?.toISOString() ?? null,
                availableEndDate: m.request.availableEndDate?.toISOString() ?? null,
                investigationSummary: m.request.investigationSummary,
                paymentCycle: m.request.paymentCycle,
                rewardMinYen: m.request.rewardMinYen === null ? null : Number(m.request.rewardMinYen),
                status: m.request.status,
                companyName: m.request.contractorUser.company?.name ?? null,
              },
            },
          ]
        : []
    ),
  };

  return NextResponse.json(response);
}
