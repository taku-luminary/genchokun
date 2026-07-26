import { prisma } from "@/app/_libs/prisma";

// 評価の集計結果（平均点と件数）
export type CompanyRatingSummary = { average: number; count: number };

// 評価の役割: 工事店として受けた評価 / 販売店として受けた評価
export type ReviewRole = "contractor" | "sales";

/**
 * 複数企業の「指定した役割での」評価をまとめて集計する（N+1回避）。
 * companyIds は文字列（BigIntを .toString() したもの）で受け取る。
 * 戻り値は Map（会社ID文字列 → 集計結果）。レビュー0件の企業は Map に入らない。
 */
export async function getCompanyRatingsByCompanyIds(
  companyIds: string[],
  role: ReviewRole,
): Promise<Map<string, CompanyRatingSummary>> {
  const result = new Map<string, CompanyRatingSummary>();
  if (companyIds.length === 0) return result;

  const grouped = await prisma.reviews.groupBy({
    by: ["revieweeCompanyId"],
    where: {
      revieweeCompanyId: { in: companyIds.map((id) => BigInt(id)) },
      targetRole: role,
    },
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
    // 総合＝5項目それぞれの平均を、さらに平均したもの（＝1件ごとの平均の平均に一致）
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

/**
 * 単体ページ用の薄いラッパー。1企業分だけ欲しいときに使う。
 * レビュー0件なら null を返す。
 */
export async function getCompanyRating(
  companyId: string,
  role: ReviewRole,
): Promise<CompanyRatingSummary | null> {
  const map = await getCompanyRatingsByCompanyIds([companyId], role);
  return map.get(companyId) ?? null;
}
