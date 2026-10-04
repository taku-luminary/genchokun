import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAdminUser } from "@/app/_libs/getAdminUser";
import { calcDaysLeft, toJstYmd } from "@/app/_utils/format";
import type {
  AdminProjectsResponse,
  AdminProjectRow,
  AdminProjectApplicant,
  AdminProjectState,
  AdminProjectFollowUp,
} from "@/app/admin/_type/adminProjects";

type ErrorResponse = { error: string };

// 管理者だけが見るデータなので、静的化もキャッシュもさせない
export const dynamic = "force-dynamic";

// 期限切れ判定はアプリのカード表示と必ず同じ関数を使う。
// 自前で日付を比較すると「終了日当日」が期限切れ扱いになり、
// 応募可否の判定（当日はOK）と食い違う。
const isExpired = (endDate: Date | null) => {
  const daysLeft = calcDaysLeft(endDate);
  return daysLeft !== null && daysLeft < 0;
};

// @db.Date は UTC の0時固定なので、ISO を10文字切るとDBに入っている日付そのものになる
const toYmd = (d: Date | null) => (d === null ? null : d.toISOString().slice(0, 10));

export async function GET(): Promise<
  NextResponse<AdminProjectsResponse | ErrorResponse>
> {
  try {
    // 画面側（app/admin/layout.tsx）でも弾いているが、
    // API を直接叩かれた場合に備えて route 内でも必ず再確認する
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // 1回の findMany + ネストした select で全部取る。
    // Prisma はリレーション1階層につき1クエリにまとめるので、件数が増えても
    // クエリ本数は一定（N+1 にならない）。
    //
    // 応募一覧はふつう pending / active だけを見るが（mypage の案件詳細など）、
    // この画面は落選者をフォローするのが目的なので status で絞らず全件取る。
    //
    // 削除済み（deletedAt）も取る。既定では画面側で隠し、チェックボックスで出し入れする。
    // ※ 既存の /api/admin/dashboard は deletedAt: null で絞っているので挙動が違う
    const projects = await prisma.projects.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        workStartDate: true,
        workEndDate: true,
        deletedAt: true,
        salesUserId: true,
        salesUser: {
          select: {
            email: true,
            lastSeenAt: true, // 訪問状況の判定に使う（既存ユーザー一覧の「最終訪問」と同じ値）
            company: {
              select: {
                id: true,
                name: true,
                contactPhone: true,
                contactEmail: true,
                contactLineId: true,
                contactNote: true,
              },
            },
          },
        },
        matches: {
          orderBy: { createdAt: "asc" }, // 申込順。先頭が最初の応募、末尾が最新の応募
          select: {
            id: true,
            status: true,
            createdAt: true,
            contractorUserId: true,
            applicationDetail: { select: { message: true } },
            contractorUser: {
              select: {
                email: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    contactPhone: true,
                    contactEmail: true,
                    contactLineId: true,
                    contactNote: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const now = Date.now();
    const elapsedDays = (from: Date) =>
      Math.floor((now - from.getTime()) / 86400000);

    // 「本日掲載」の判定用。日本時間の今日の日付（YYYY-MM-DD）
    const todayJst = toJstYmd(new Date());

    // ---- 応募者（工事店）ごとの累計と連続落選 ----
    // 全案件の応募を1本にならしてユーザー単位でまとめる。取得済みの配列から作るので追加クエリは不要。
    // 削除済み案件への応募も含むが、応募が入っていると案件は削除できない仕様なので実際には影響しない。
    type ContractorStat = AdminProjectApplicant["stats"];
    const matchesByContractor = new Map<
      string,
      { status: string; createdAt: Date }[]
    >();
    for (const p of projects) {
      for (const m of p.matches) {
        const list = matchesByContractor.get(m.contractorUserId) ?? [];
        list.push({ status: m.status, createdAt: m.createdAt });
        matchesByContractor.set(m.contractorUserId, list);
      }
    }

    const statsByContractor = new Map<string, ContractorStat>();
    for (const [userId, list] of matchesByContractor) {
      // 連続落選＝応募日時の新しい順に見て、落選が続いている数。
      // 結果待ち(pending)と取消(cancelled)は飛ばす（結果が出ていない応募で
      // 連敗記録がリセットされるのはおかしいため）。決定(active)に当たったら止める。
      const newestFirst = [...list].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      let rejectStreak = 0;
      for (const m of newestFirst) {
        if (m.status === "pending" || m.status === "cancelled") continue;
        if (m.status === "rejected") {
          rejectStreak += 1;
          continue;
        }
        break; // active
      }
      statsByContractor.set(userId, {
        applied: list.length,
        won: list.filter((m) => m.status === "active").length,
        lost: list.filter((m) => m.status === "rejected").length,
        rejectStreak,
      });
    }

    // ---- 掲載者（販売店）ごとの投稿実績 ----
    // 連絡先モーダルに出し、「決めない癖」があるかを電話前に把握できるようにする。
    // 取り下げた案件は数えない（合計と内訳が必ず一致するようにするため）。
    type SalesStat = {
      postTotal: number;
      postWon: number;
      postLost: number;
      postOpen: number;
    };
    const salesStatByUser = new Map<string, SalesStat>();
    for (const p of projects) {
      if (p.deletedAt !== null) continue;
      const cur = salesStatByUser.get(p.salesUserId) ?? {
        postTotal: 0,
        postWon: 0,
        postLost: 0,
        postOpen: 0,
      };
      cur.postTotal += 1;
      if (p.matches.some((m) => m.status === "active")) cur.postWon += 1;
      else if (isExpired(p.workEndDate)) cur.postLost += 1;
      else cur.postOpen += 1;
      salesStatByUser.set(p.salesUserId, cur);
    }

    // ---- 1行ずつ組み立て ----
    const rows: AdminProjectRow[] = projects.map((p) => {
      const pendings = p.matches.filter((m) => m.status === "pending");
      const active = p.matches.find((m) => m.status === "active") ?? null;
      const rejectedCount = p.matches.filter((m) => m.status === "rejected").length;

      const daysLeft = calcDaysLeft(p.workEndDate);
      const expired = daysLeft !== null && daysLeft < 0;

      // 状態は「削除 → 成立 → 期限切れ → 応募あり → 募集中」の順に決める。
      // 期限切れでも成立済みなら「マッチ成立」を優先する（工期が終わっただけで、
      // アプリとしては完結しているため）。成立の判断は projects.status ではなく
      // active な match の有無で行う（誰と成立したかが取れる方を正とする）。
      const state: AdminProjectState =
        p.deletedAt !== null
          ? "deleted"
          : active !== null
            ? "matched"
            : expired
              ? "expiredClosed"
              : pendings.length > 0
                ? "hasApplicants"
                : "open";

      // 訪問状況＝最新の応募が届いたあとに掲載者がアプリを開いたか。
      // matches は createdAt 昇順なので末尾が最新の応募。
      //
      // ここで matches.salesSeenAt は使えない。あれはマイページで「成立した1件」を
      // 開いたときだけ記録されるため、pending の応募は永久に未読のままになる。
      // 代わりに users.lastSeenAt（全ページ共通の最終訪問）と比べる。
      // false は「応募を見たはずがない」と断定できるが、true は「アプリを開いた」までで
      // その応募を実際に見たかは分からない。
      const lastApplied =
        p.matches.length > 0 ? p.matches[p.matches.length - 1].createdAt : null;
      const lastSeen = p.salesUser.lastSeenAt;
      const visitedAfterApply =
        lastApplied === null
          ? null
          : lastSeen !== null && lastSeen.getTime() >= lastApplied.getTime();

      // 未決定の応募を何日待たせているか（pendings は申込順なので先頭が最も古い）
      const waitDays =
        pendings.length > 0 ? elapsedDays(pendings[0].createdAt) : null;

      const salesStat = salesStatByUser.get(p.salesUserId) ?? {
        postTotal: 0,
        postWon: 0,
        postLost: 0,
        postOpen: 0,
      };
      const salesCompany = p.salesUser.company;
      const createdAtJst = toJstYmd(p.createdAt);

      return {
        projectId: p.id.toString(),
        title: p.title,
        createdAtJst,
        createdAt: p.createdAt.toISOString(),
        workStartDate: toYmd(p.workStartDate),
        workEndDate: toYmd(p.workEndDate),
        daysLeft,
        state,
        isDeleted: p.deletedAt !== null,
        salesUser: {
          companyId: salesCompany?.id.toString() ?? null,
          companyName: salesCompany?.name ?? null,
          contactPhone: salesCompany?.contactPhone ?? null,
          contactEmail: salesCompany?.contactEmail ?? null,
          contactLineId: salesCompany?.contactLineId ?? null,
          contactNote: salesCompany?.contactNote ?? null,
          loginEmail: p.salesUser.email,
          postTotal: salesStat.postTotal,
          postWon: salesStat.postWon,
          postLost: salesStat.postLost,
          postOpen: salesStat.postOpen,
          lastSeenAt: p.salesUser.lastSeenAt?.toISOString() ?? null,
        },
        lastAppliedAt: lastApplied?.toISOString() ?? null,
        visitedAfterApply,
        // 応募が来た総数（落選を含む）。アプリのカードの「応募N件」は落選を除くので一致しない
        applicantCount: p.matches.length,
        pendingCount: pendings.length,
        rejectedCount,
        waitDays,
        followUp: buildFollowUp({
          state,
          pendingCount: pendings.length,
          rejectedCount,
          waitDays,
          daysLeft,
          visitedAfterApply,
          postedToday: createdAtJst === todayJst,
        }),
        applicants: p.matches.map((m): AdminProjectApplicant => {
          const company = m.contractorUser.company;
          return {
            matchId: m.id.toString(),
            status: m.status,
            appliedAt: m.createdAt.toISOString(),
            companyId: company?.id.toString() ?? null,
            companyName: company?.name ?? null,
            contactPhone: company?.contactPhone ?? null,
            contactEmail: company?.contactEmail ?? null,
            contactLineId: company?.contactLineId ?? null,
            contactNote: company?.contactNote ?? null,
            loginEmail: m.contractorUser.email,
            message: m.applicationDetail?.message ?? null,
            stats: statsByContractor.get(m.contractorUserId) ?? {
              applied: 0,
              won: 0,
              lost: 0,
              rejectStreak: 0,
            },
          };
        }),
      };
    });

    return NextResponse.json(
      { projects: rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

// 要対応の判定。上段(label)＝管理者が取る行動、下段(sub)＝理由と期限。
// 優先度は「先に手を打つべき順」。
//   1: まだ救える（掲載者が動けば成立する） / 2: すでに不成立になった（教育対象）
//   3: 人のフォロー（落選者） / 4〜5: 受け手不足のシグナル / 6: 対応不要
//
// 色は赤＝「放っておくと不成立が確定する／すでに不成立になった」ものだけに付ける。
// ここを崩すと「赤が付いた行＝必ず手を打つ行」という読み方が成立しなくなる。
function buildFollowUp(a: {
  state: AdminProjectState;
  pendingCount: number;
  rejectedCount: number;
  waitDays: number | null;
  daysLeft: number | null;
  visitedAfterApply: boolean | null;
  postedToday: boolean;
}): AdminProjectFollowUp {
  const left = a.daysLeft === null ? "終了日未設定" : `残り${a.daysLeft}日`;

  if (a.state === "deleted") {
    return { priority: 6, tone: "slate", label: "対応不要", sub: "削除済み" };
  }

  if (a.state === "matched") {
    if (a.rejectedCount > 0) {
      return {
        priority: 3,
        tone: "amber",
        label: "落選者にフォロー",
        sub: `落選${a.rejectedCount}名`,
      };
    }
    return { priority: 6, tone: "slate", label: "対応不要", sub: "成立済み" };
  }

  if (a.state === "expiredClosed") {
    // 応募が届いたあと掲載者が一度もアプリを開かないまま終わった。
    // 通知が届いていない疑いがあり、アプリ側の問題の可能性がある。
    if (a.pendingCount > 0 && a.visitedAfterApply === false) {
      return {
        priority: 2,
        tone: "red",
        label: "気づかず期限切れ",
        sub: `応募${a.pendingCount}件・未訪問のまま終了`,
      };
    }
    if (a.pendingCount > 0) {
      return {
        priority: 2,
        tone: "red",
        label: "決めずに期限切れ",
        sub: `応募${a.pendingCount}件・見たうえで未決定`,
      };
    }
    return {
      priority: 4,
      tone: "amber",
      label: "応募0で終了",
      sub: "受け手が見つからなかった",
    };
  }

  if (a.state === "hasApplicants") {
    // 掲載者が応募に気づいていない。自然には進まないので必ず赤。
    // 「決め方の案内」より先に「応募が来ていますよ」と知らせる。
    if (a.visitedAfterApply === false) {
      return {
        priority: 1,
        tone: "red",
        label: "応募を知らせる",
        sub: `応募${a.pendingCount}件・掲載者は未訪問`,
      };
    }
    // 応募が来てから数日は掲載者が検討している正常な状態なので色を付けない。
    // 赤にするのは「もう決めないと期限切れ」か「1週間動いていない」場合だけ。
    const wait = a.waitDays ?? 0;
    const urgent = (a.daysLeft !== null && a.daysLeft <= 3) || wait >= 7;
    const tone = urgent ? "red" : wait >= 3 ? "amber" : "slate";
    return {
      priority: 1,
      tone,
      label: "決定を促す",
      sub: `応募${a.pendingCount}件・${left}・${wait}日経過`,
    };
  }

  // 募集中・応募0。
  // 掲載したばかりの案件は「周知がまだ行き届いていない」状態なので、条件の見直しではなく
  // まず全ユーザーへ知らせるのが正しい行動。期限が近づいてから条件の見直しに切り替える。
  if (a.postedToday) {
    return {
      priority: 5,
      tone: "green",
      label: "【本日掲載】全ユーザーへ新規案件周知",
      sub: `応募0・${left}`,
    };
  }
  if (a.daysLeft !== null && a.daysLeft <= 3) {
    return {
      priority: 5,
      tone: "red",
      label: "応募が来るようフォロー",
      sub: `応募0・${left}`,
    };
  }
  if (a.daysLeft !== null && a.daysLeft <= 7) {
    return {
      priority: 5,
      tone: "amber",
      label: "応募が来るようフォロー",
      sub: `応募0・${left}`,
    };
  }
  return {
    priority: 5,
    tone: "slateStrong",
    label: "全ユーザーへ新規案件周知",
    sub: `応募0・${left}`,
  };
}
