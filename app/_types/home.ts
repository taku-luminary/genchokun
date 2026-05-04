// トップページ（/api/home）が返すデータの型

export type HomeProject = {
  id: string;
  created_at: string;
  prefecture: { name: string };
  city: string | null;
  title: string;
  workStartDate: string | null;
  workEndDate: string | null;
  rewardYen: number | null;
  paymentCycle: string | null;
  status: "open" | "completed";
  companyName: string | null; // 発注者の会社名
};

export type HomeRequest = {
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
  companyName: string | null; // 工事店の会社名
};

export type HomeApiResponse = {
  projects: HomeProject[];
  requests: HomeRequest[];
};