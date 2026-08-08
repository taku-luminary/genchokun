import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
// ▼ 追加: レビュー待ち判定（純粋関数）と、相手企業の合算★バッチ取得
import { isReviewPending } from "@/app/_libs/reviewEligibility";
import { getCompanyOverallRatingsByCompanyIds } from "@/app/_libs/companyRatings";
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
  const [todoCount, projects, requests, appliedProjectMatches, appliedRequestMatches, myCompany] =
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
      // ▼ 追加: レビュー待ち判定で「自社が既に書いたレビュー」を照合するため、自社の会社IDを取得
      prisma.companies.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
    ]);

  // 会社未登録のユーザーはレビューを書けない → レビュー待ちは常に無し（詳細ページと同じ挙動）
  const canReview = myCompany !== null;
  const now = new Date();

  // ▼ 追加: レビュー待ちになりうるのは active マッチだけ。4ソースから active マッチのIDを集める。
  const activeMatchIds: bigint[] = [];
  for (const p of projects) {
    for (const m of p.matches) if (m.status === "active") activeMatchIds.push(m.id);
  }
  for (const r of requests) {
    if (r.match?.status === "active") activeMatchIds.push(r.match.id);
  }
  for (const m of appliedProjectMatches) {
    if (m.status === "active") activeMatchIds.push(m.id);
  }
  for (const m of appliedRequestMatches) {
    if (m.status === "active") activeMatchIds.push(m.id);
  }

  // ▼ 追加: 応募カードに出す「相手企業」の会社IDを集める（合算★をまとめて取るため）
  const counterpartyCompanyIds: string[] = [];
  for (const m of appliedProjectMatches) {
    const id = m.project?.salesUser.company?.id;
    if (id) counterpartyCompanyIds.push(id.toString());
  }
  for (const m of appliedRequestMatches) {
    const id = m.request?.contractorUser.company?.id;
    if (id) counterpartyCompanyIds.push(id.toString());
  }

  // ▼ 追加: N+1を避けるため追加クエリは2本だけ（並列）。
  //   (a) 自社が既に書いたレビューの matchId 一覧（レビュー待ち＝未投稿の突合用）
  //   (b) 応募相手企業の合算★（0件企業は Map に入らない → カードで「（0件）」表示）
  const [reviewedRows, ratingsMap] = await Promise.all([
    canReview && activeMatchIds.length > 0
      ? prisma.reviews.findMany({
          where: { reviewerCompanyId: myCompany.id, matchId: { in: activeMatchIds } },
          select: { matchId: true },
        })
      : Promise.resolve<{ matchId: bigint }[]>([]),
    getCompanyOverallRatingsByCompanyIds(counterpartyCompanyIds),
  ]);
  const reviewedMatchIds = new Set(reviewedRows.map((r) => r.matchId.toString()));

  // ── 一覧を組み立てる（先に配列を作ってから件数を数える）──

  const mypageProjects = projects.map((p) => {
    // 自分は販売店側（自分の投稿）。active なマッチを1件特定する。
    const activeMatch = p.matches.find((m) => m.status === "active") ?? null;
    const reviewPending =
      canReview &&
      p.matches.some((m) =>
        isReviewPending({
          matchStatus: m.status,
          dateField: p.workEndDate,
          matchCreatedAt: m.createdAt,
          alreadyReviewed: reviewedMatchIds.has(m.id.toString()),
          now,
        }),
      );
    // 新しくマッチング = active・自分(販売店)が未読・レビュー待ちでない
    const newMatch =
      activeMatch !== null && activeMatch.salesSeenAt === null && !reviewPending;
    return {
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
      reviewPending,
      newMatch,
      activeMatchId: activeMatch ? activeMatch.id.toString() : null,
      matches: p.matches.map((m) => ({ status: m.status })),
    };
  });

  const mypageRequests = requests.map((r) => {
    // 自分は工事店側（自分の投稿）。
    const activeMatch = r.match && r.match.status === "active" ? r.match : null;
    const reviewPending =
      canReview && r.match !== null
        ? isReviewPending({
            matchStatus: r.match.status,
            dateField: r.availableEndDate,
            matchCreatedAt: r.match.createdAt,
            alreadyReviewed: reviewedMatchIds.has(r.match.id.toString()),
            now,
          })
        : false;
    // 新しくマッチング = active・自分(工事店)が未読・レビュー待ちでない
    const newMatch =
      activeMatch !== null && activeMatch.contractorSeenAt === null && !reviewPending;
    return {
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
      reviewPending,
      newMatch,
      activeMatchId: activeMatch ? activeMatch.id.toString() : null,
      match: r.match ? { status: r.match.status } : null,
    };
  });

  // ▼ 追加: 応募した project 一覧。
  //         where 句で projectId ≠ null に絞っているので m.project は必ず存在するが、
  //         Prisma の型上は null がありうるため、flatMap で「null なら空配列(=スキップ)、
  //         あれば1件の配列」を返して型安全に除外している。
  const appliedProjects = appliedProjectMatches.flatMap((m) => {
    if (!m.project) return [];
    const reviewPending =
      canReview &&
      isReviewPending({
        matchStatus: m.status,
        dateField: m.project.workEndDate,
        matchCreatedAt: m.createdAt,
        alreadyReviewed: reviewedMatchIds.has(m.id.toString()),
        now,
      });
    // 応募project では自分は工事店側 → contractorSeenAt を見る
    const newMatch =
      m.status === "active" && m.contractorSeenAt === null && !reviewPending;
    return [
      {
        matchId: m.id.toString(),
        myStatus: m.status,
        reviewPending,
        newMatch,
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
          // ▼ 追加: 相手（発注者）企業の合算★。0件なら null → カードで「（0件）」
          companyRating: m.project.salesUser.company
            ? ratingsMap.get(m.project.salesUser.company.id.toString()) ?? null
            : null,
        },
      },
    ];
  });

  // ▼ 追加: 応募した request 一覧（構造は appliedProjects と同じ）
  const appliedRequests = appliedRequestMatches.flatMap((m) => {
    if (!m.request) return [];
    const reviewPending =
      canReview &&
      isReviewPending({
        matchStatus: m.status,
        dateField: m.request.availableEndDate,
        matchCreatedAt: m.createdAt,
        alreadyReviewed: reviewedMatchIds.has(m.id.toString()),
        now,
      });
    // 応募request では自分は販売店側 → salesSeenAt を見る
    const newMatch =
      m.status === "active" && m.salesSeenAt === null && !reviewPending;
    return [
      {
        matchId: m.id.toString(),
        myStatus: m.status,
        reviewPending,
        newMatch,
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
          // ▼ 追加: 相手企業の合算★。0件なら null → カードで「（0件）」
          companyRating: m.request.contractorUser.company
            ? ratingsMap.get(m.request.contractorUser.company.id.toString()) ?? null
            : null,
        },
      },
    ];
  });

  // ▼ 追加: レビュー待ちの合計件数（4リストで reviewPending が true のもの）
  const reviewPendingCount =
    mypageProjects.filter((p) => p.reviewPending).length +
    mypageRequests.filter((r) => r.reviewPending).length +
    appliedProjects.filter((a) => a.reviewPending).length +
    appliedRequests.filter((a) => a.reviewPending).length;

  // ▼ 追加: 新しくマッチングの合計件数（4リストで newMatch が true のもの）
  const newMatchCount =
    mypageProjects.filter((p) => p.newMatch).length +
    mypageRequests.filter((r) => r.newMatch).length +
    appliedProjects.filter((a) => a.newMatch).length +
    appliedRequests.filter((a) => a.newMatch).length;

  const response: MypageApiResponse = {
    stats: {
      // 掲載した案件 = 掲載した工事案件 + 掲載したお仕事待ち の合算
      postedCount: projects.length + requests.length,
      // 応募した案件 = 工事案件への応募 + お仕事待ちへの応募 の合算
      appliedCount: appliedProjectMatches.length + appliedRequestMatches.length,
      todoCount,
      // ▼ 追加: レビュー待ちの合計件数
      reviewPendingCount,
      // ▼ 追加: 新しくマッチングの合計件数
      newMatchCount,
    },
    projects: mypageProjects,
    requests: mypageRequests,
    appliedProjects,
    appliedRequests,
  };

  return NextResponse.json(response);
}
