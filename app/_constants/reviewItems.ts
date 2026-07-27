import type { ReviewRole } from "@/app/_libs/companyRatings";

// item1Rating〜item5Rating の「意味（ラベル）」を役割ごとに定義する。
// 配列の並び順が item1, item2, item3, item4, item5 に対応する（先頭が item1）。
export const REVIEW_ITEM_LABELS: Record<
  ReviewRole,
  readonly [string, string, string, string, string]
> = {
  // 工事店を評価するとき（販売店 → 工事店 / targetRole = "contractor"）
  contractor: [
    "連絡・報告",
    "指示・仕様の遵守",
    "納期・約束の遵守",
    "顧客・現場対応",
    "施工・完了品質",
  ],
  // 販売店を評価するとき（工事店 → 販売店 / targetRole = "sales"）
  sales: [
    "発注内容の明確さ",
    "連絡・判断の速さ",
    "顧客・現場調整",
    "契約・変更対応",
    "支払いの確実さ",
  ],
};

// 総合評価のラベル（役割によらず共通）
export const OVERALL_LABEL = "総合評価";
