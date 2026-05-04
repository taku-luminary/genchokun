// /api/mypage が返すデータ全体の型
export type MypageApiResponse = {
  stats: {
    todoCount: number;
    projectCount: number;
    applicationCount: number;
  };
  projects: MypageProject[];
  requests: MypageRequest[];
};

// 工事案件1件の型
export type MypageProject = {
  id: string;
  created_at: string;
  prefecture: { name: string };
  city: string | null;
  title: string;           // ← 追加
  workStartDate: string | null;
  workEndDate: string | null;
  investigationSummary: string | null;
  paymentCycle: string | null;
  rewardYen: number | null;
  status: "open" | "completed";
  matches: { status: string }[];
};

// 工事店依頼1件の型
export type MypageRequest = {
  id: string;
  created_at: string;
  prefecture: { name: string };
  city: string | null;
  availableStartDate: string | null;
  availableEndDate: string | null;
  investigationSummary: string | null;
  paymentCycle: string | null;
  rewardMinYen: number | null;
  status: "open" | "completed";
  match: { status: string } | null;
};