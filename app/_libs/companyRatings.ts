import { prisma } from "@/app/_libs/prisma";

// 評価の集計結果（平均点と件数）
export type CompanyRatingSummary = { average: number; count: number };

// 評価の役割: 工事店として受けた評価 / 販売店として受けた評価
export type ReviewRole = "contractor" | "sales";

/*
 * 複数ユーザーの「指定した役割での」評価をまとめて集計する。
 *
 * 一覧ページ（案件がたくさん並ぶ）で1件ずつ集計するとDBアクセスが件数分
 * 発生してしまう（N+1問題）。それを避けるため、ユーザーIDの配列を受け取り
 * groupBy で「1回のクエリ」でまとめて集計する。
 *
 * 戻り値は Map（userId → 集計結果）。レビューが0件のユーザーは Map に入らない。
 */
export async function getCompanyRatingsByUserIds(
  userIds: string[],
  role: ReviewRole,
): Promise<Map<string, CompanyRatingSummary>> {
  const result = new Map<string, CompanyRatingSummary>();
  // 空配列でクエリを投げないようガード（無駄なDBアクセス防止）
  if (userIds.length === 0) return result;

  // revieweeUserId（評価される人）ごとに、overallRating の平均と件数を集計する
  const grouped = await prisma.reviews.groupBy({
    by: ["revieweeUserId"],
    where: {
      revieweeUserId: { in: userIds },
      targetRole: role,
    },
    _avg: { overallRating: true },
    _count: { _all: true },
  });

  for (const g of grouped) {
    const avg = g._avg.overallRating ?? 0;
    result.set(g.revieweeUserId, {
      // 星は0.1刻みで塗るので、平均は小数第1位に丸める（例: 4.666… → 4.7）
      average: Math.round(avg * 10) / 10,
      count: g._count._all,
    });
  }
  return result;
}

/**
 * 単体ページ用の薄いラッパー。1ユーザー分だけ欲しいときに使う。
 * レビューが0件なら null を返す（呼び出し側で「星を出さない」判断に使う）。
 */
export async function getCompanyRating(
  userId: string,
  role: ReviewRole,
): Promise<CompanyRatingSummary | null> {
  const map = await getCompanyRatingsByUserIds([userId], role);
  return map.get(userId) ?? null;
}
