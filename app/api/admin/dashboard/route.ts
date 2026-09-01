import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAdminUser } from "@/app/_libs/getAdminUser";
import type {
  AdminDashboardResponse,
  AdminUserRow,
} from "@/app/_types/adminDashboard";
import { calcDaysLeft } from "@/app/_utils/format";

type ErrorResponse = { error: string };

export const dynamic = "force-dynamic";

const rate = (matched: number, total: number) =>
  total > 0 ? Math.round((matched / total) * 100) : 0;

// createdAt(UTC) を「日本時間の YYYY-MM-DD」に
const jstDayKey = (d: Date) =>
  new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const addDays = (key: string, n: number) => {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const toDaily = (dates: string[], rows: { createdAt: Date }[]) => {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = jstDayKey(r.createdAt);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return dates.map((k) => map.get(k) ?? 0);
};

export async function GET(): Promise<
  NextResponse<AdminDashboardResponse | ErrorResponse>
> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // まとめて取得（ここからすべて算出）
    const [users, companies, projects, requests, matches, reviews, articles] =
      await Promise.all([
        prisma.users.findMany({ select: { id: true, email: true, createdAt: true, lastSeenAt: true } }),
        prisma.companies.findMany({ select: { id: true, userId: true, name: true, createdAt: true } }),
        prisma.projects.findMany({ where: { deletedAt: null }, select: { id: true, salesUserId: true, status: true, createdAt: true, workEndDate: true } }),
        prisma.requests.findMany({ where: { deletedAt: null }, select: { id: true, contractorUserId: true, status: true, createdAt: true, availableEndDate: true } }),
        prisma.matches.findMany({ select: { projectId: true, requestId: true, salesUserId: true, contractorUserId: true, status: true, createdAt: true, salesSeenAt: true, contractorSeenAt: true } }),
        prisma.reviews.findMany({ select: { revieweeCompanyId: true, item1Rating: true, item2Rating: true, item3Rating: true, item4Rating: true, item5Rating: true } }),
        prisma.company_interview_articles.findMany({ select: { companyId: true, status: true, youtubeUrl: true } }),
      ]);

    // 最終ログイン（auth.users）
    const loginRows = await prisma.$queryRaw<
      { id: string; last_sign_in_at: Date | null }[]
    >`SELECT id, last_sign_in_at FROM auth.users`;
    const lastLoginByUser = new Map(loginRows.map((r) => [r.id, r.last_sign_in_at]));

    // マッチ済（active）を案件/依頼ごとに1件へ集約
    // 削除されていない（生きている）案件・依頼のIDだけを集合にしておく。
    // ※ projects / requests は既に deletedAt:null で取得済み ＝ この集合には削除分は入らない
    const liveProjectIds = new Set(projects.map((p) => p.id.toString()));
    const liveRequestIds = new Set(requests.map((r) => r.id.toString()));

    const projMatchedMap = new Map<string, Date>();
    const reqMatchedMap = new Map<string, Date>();
    for (const m of matches) {
      // マッチ相手の案件が「生きている」時だけマッチ済に数える（削除済みは除外）
      if (
        m.status === "active" &&
        m.projectId != null &&
        liveProjectIds.has(m.projectId.toString())
      ) {
        const k = m.projectId.toString();
        if (!projMatchedMap.has(k)) projMatchedMap.set(k, m.createdAt);
      }
      if (
        m.status === "active" &&
        m.requestId != null &&
        liveRequestIds.has(m.requestId.toString())
      ) {
        const k = m.requestId.toString();
        if (!reqMatchedMap.has(k)) reqMatchedMap.set(k, m.createdAt);
      }
    }

    // ---- 概況 ----
    // アプリのカード表示(isEffectivelyCompleted)と同じ基準で「募集中」を数える。
    // status が open でも終了日を過ぎていれば「終了」扱いにし、募集中から除外する。
    const isExpired = (endDate: Date | null) => {
      const daysLeft = calcDaysLeft(endDate);
      return daysLeft !== null && daysLeft < 0;
    };
    const projOpen = projects.filter((p) => p.status === "open" && !isExpired(p.workEndDate));
    const reqOpen = requests.filter((r) => r.status === "open" && !isExpired(r.availableEndDate));
    const overview = {
      totalUsers: users.length,
      totalCompanies: companies.length,
      registrationRate: rate(companies.length, users.length),
      projects: { open: projOpen.length, matched: projMatchedMap.size, total: projects.length, matchRate: rate(projMatchedMap.size, projects.length) },
      requests: { open: reqOpen.length, matched: reqMatchedMap.size, total: requests.length, matchRate: rate(reqMatchedMap.size, requests.length) },
    };

    // ---- 日別 ----
    const postDates = [...projects, ...requests].map((r) => r.createdAt);
    const endKey = jstDayKey(new Date());
    let startKey = postDates.length
      ? jstDayKey(new Date(Math.min(...postDates.map((d) => d.getTime()))))
      : endKey;
    const cap = addDays(endKey, -365);
    if (startKey < cap) startKey = cap;
    const dates: string[] = [];
    for (let k = startKey; k <= endKey; k = addDays(k, 1)) dates.push(k);

    const asRows = (m: Map<string, Date>) =>
      [...m.values()].map((d) => ({ createdAt: d }));
    const daily = {
      dates,
      companies: toDaily(dates, companies), 
      projects: { open: toDaily(dates, projOpen), matched: toDaily(dates, asRows(projMatchedMap)), total: toDaily(dates, projects) },
      requests: { open: toDaily(dates, reqOpen), matched: toDaily(dates, asRows(reqMatchedMap)), total: toDaily(dates, requests) },
    };

    // ---- ユーザー一覧 ----
    const companyByUser = new Map(
      companies.map((c) => [c.userId, { id: Number(c.id), name: c.name }])
    );

    // 会社ごとの受け取りレビュー（件数・平均）
    const revByCompany = new Map<number, { sum: number; count: number }>();
    for (const rv of reviews) {
      const cid = Number(rv.revieweeCompanyId);
      const avg5 =
        (rv.item1Rating + rv.item2Rating + rv.item3Rating + rv.item4Rating + rv.item5Rating) / 5;
      const cur = revByCompany.get(cid) ?? { sum: 0, count: 0 };
      cur.sum += avg5;
      cur.count += 1;
      revByCompany.set(cid, cur);
    }

    // 会社ごとの取材記事/動画
    const articleByCompany = new Map<number, { hasArticle: boolean; hasVideo: boolean }>();
    for (const ar of articles) {
      const cid = Number(ar.companyId);
      const published = ar.status === "published";
      articleByCompany.set(cid, { hasArticle: published, hasVideo: published && !!ar.youtubeUrl });
    }

    // ユーザーごとの集計器
    type Acc = {
      projPost: number; projMatch: number; reqPost: number; reqMatch: number;
      projApply: number; projApplyMatch: number; reqApply: number; reqApplyMatch: number;
      lastActivity: number;
    };
    const acc = new Map<string, Acc>();
    for (const u of users)
      acc.set(u.id, { projPost: 0, projMatch: 0, reqPost: 0, reqMatch: 0, projApply: 0, projApplyMatch: 0, reqApply: 0, reqApplyMatch: 0, lastActivity: 0 });

    const touch = (userId: string, d: Date | null) => {
      const a = acc.get(userId);
      if (!a || !d) return;
      if (d.getTime() > a.lastActivity) a.lastActivity = d.getTime();
    };

    for (const p of projects) {
      const a = acc.get(p.salesUserId);
      if (!a) continue;
      a.projPost++;
      if (projMatchedMap.has(p.id.toString())) a.projMatch++;
      touch(p.salesUserId, p.createdAt);
    }
    for (const r of requests) {
      const a = acc.get(r.contractorUserId);
      if (!a) continue;
      a.reqPost++;
      if (reqMatchedMap.has(r.id.toString())) a.reqMatch++;
      touch(r.contractorUserId, r.createdAt);
    }
    for (const m of matches) {
      // 応募先の案件が「生きている（未削除）」時だけ 案件応募 に数える
      if (m.projectId != null && liveProjectIds.has(m.projectId.toString())) {
        const a = acc.get(m.contractorUserId);
        if (a) { a.projApply++; if (m.status === "active") a.projApplyMatch++; }
      }
      // 応募先の依頼が「生きている（未削除）」時だけ 依頼応募 に数える
      if (m.requestId != null && liveRequestIds.has(m.requestId.toString())) {
        const a = acc.get(m.salesUserId);
        if (a) { a.reqApply++; if (m.status === "active") a.reqApplyMatch++; }
      }
      // 最終活動の時刻は「操作した事実」なので、後から削除されても更新は残す
      touch(m.salesUserId, m.createdAt);
      touch(m.contractorUserId, m.createdAt);
      touch(m.salesUserId, m.salesSeenAt);
      touch(m.contractorUserId, m.contractorSeenAt);
    }

    const userRows: AdminUserRow[] = users.map((u) => {
      const a = acc.get(u.id)!;
      const comp = companyByUser.get(u.id) ?? null;
      const rev = comp ? revByCompany.get(comp.id) : undefined;
      const art = comp ? articleByCompany.get(comp.id) : undefined;
      const login = lastLoginByUser.get(u.id) ?? null;
      return {
        userId: u.id,
        email: u.email,
        companyId: comp?.id ?? null,
        companyName: comp?.name ?? null,
        registeredAt: u.createdAt.toISOString(),
        lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
        lastLoginAt: login ? login.toISOString() : null,
        lastActivityAt: a.lastActivity ? new Date(a.lastActivity).toISOString() : null,
        reviewCount: rev?.count ?? 0,
        reviewAvg: rev && rev.count > 0 ? Math.round((rev.sum / rev.count) * 10) / 10 : null,
        hasArticle: art?.hasArticle ?? false,
        hasVideo: art?.hasVideo ?? false,
        projPost: a.projPost, projMatch: a.projMatch,
        reqPost: a.reqPost, reqMatch: a.reqMatch,
        projApply: a.projApply, projApplyMatch: a.projApplyMatch,
        reqApply: a.reqApply, reqApplyMatch: a.reqApplyMatch,
      };
    });

    return NextResponse.json(
      { overview, daily, users: userRows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
