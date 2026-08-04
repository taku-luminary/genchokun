import { prisma } from "@/app/_libs/prisma";

// 評価の集計結果（平均点と件数）
export type CompanyRatingSummary = { average: number; count: number };

// 評価の役割: 工事店として受けた評価 / 販売店として受けた評価
export type ReviewRole = "contractor" | "sales";

/**
 * 企業の「役割を問わない」総合評価（工事店として＋販売店としての全レビューの平均）。
 * レビュー0件なら null。カード横・レビューページ上部の★に使う。
 */
export async function getCompanyOverallRating(
  companyId: string,
): Promise<CompanyRatingSummary | null> {
  const agg = await prisma.reviews.aggregate({
    where: { revieweeCompanyId: BigInt(companyId) },
    _avg: {
      item1Rating: true,
      item2Rating: true,
      item3Rating: true,
      item4Rating: true,
      item5Rating: true,
    },
    _count: { _all: true },
  });

  if (agg._count._all === 0) return null;

  const a = agg._avg;
  const overall =
    ((a.item1Rating ?? 0) +
      (a.item2Rating ?? 0) +
      (a.item3Rating ?? 0) +
      (a.item4Rating ?? 0) +
      (a.item5Rating ?? 0)) /
    5;

  return {
    average: Math.round(overall * 10) / 10,
    count: agg._count._all,
  };
}
/**
 * 複数企業の「役割を問わない」総合評価をまとめて集計する（N+1回避）。
 * 戻り値は Map（会社ID文字列 → 集計）。レビュー0件の企業は Map に入らない。
 */
export async function getCompanyOverallRatingsByCompanyIds(
  companyIds: string[],
): Promise<Map<string, CompanyRatingSummary>> {
  const result = new Map<string, CompanyRatingSummary>();
  if (companyIds.length === 0) return result;

  const grouped = await prisma.reviews.groupBy({
    by: ["revieweeCompanyId"],
    where: { revieweeCompanyId: { in: companyIds.map((id) => BigInt(id)) } },
    _avg: {
      item1Rating: true,
      item2Rating: true,
      item3Rating: true,
      item4Rating: true,
      item5Rating: true,
    },
    _count: { _all: true },
  });

  for (const g of grouped) {
    const a = g._avg;
    const overall =
      ((a.item1Rating ?? 0) +
        (a.item2Rating ?? 0) +
        (a.item3Rating ?? 0) +
        (a.item4Rating ?? 0) +
        (a.item5Rating ?? 0)) /
      5;
    result.set(g.revieweeCompanyId.toString(), {
      average: Math.round(overall * 10) / 10,
      count: g._count._all,
    });
  }

  return result;
}
