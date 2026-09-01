export type CategoryStats = {
  open: number; // 募集中
  matched: number; // マッチ済
  total: number; // 累積（募集中＋終了）
  matchRate: number; // マッチ率（%）
};

export type AdminOverview = {
  totalUsers: number;
  totalCompanies: number;
  registrationRate: number;
  projects: CategoryStats; // 応募できる案件
  requests: CategoryStats; // 発注待ちの事業者
};

// 日別グラフ用（open/matched/total それぞれ dates と同じ長さの件数配列）
export type DailySeries = { open: number[]; matched: number[]; total: number[] };

export type AdminDaily = {
  dates: string[];
  companies: number[];
  projects: DailySeries;
  requests: DailySeries;
};

export type AdminUserRow = {
  userId: string;
  email: string | null;
  companyId: number | null; // 会社詳細リンク用（/companies/[id]）
  companyName: string | null;
  registeredAt: string;
  lastSeenAt: string | null; // ← 追加：最終訪問（未記録は null）
  lastLoginAt: string | null;
  lastActivityAt: string | null; // ISO（最後に操作した日）
  reviewCount: number;
  reviewAvg: number | null; // 1〜5（小数1桁）
  hasArticle: boolean;
  hasVideo: boolean;
  projPost: number; // 案件投稿
  projMatch: number; // 案件投稿のマッチ
  reqPost: number; // 依頼投稿
  reqMatch: number; // 依頼投稿のマッチ
  projApply: number; // 案件応募
  projApplyMatch: number; // 案件応募のマッチ
  reqApply: number; // 依頼応募
  reqApplyMatch: number; // 依頼応募のマッチ
};

// AdminDashboardResponse を置き換え
export type AdminDashboardResponse = {
  overview: AdminOverview;
  daily: AdminDaily;
  users: AdminUserRow[];
};
