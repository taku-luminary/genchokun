export type CreateProjectRequest = {
  prefectureId: number;
  city?: string;
  title: string;
  investigationSummary?: string;
  investigationDetails?: string;
  workStartDate?: string; // "2026-01-31" 形式
  workEndDate?: string;
  rewardYen?: number;
  paymentCycle?: string;
};

// POST /api/projects のレスポンス型
export type CreateProjectResponse = {
  id: string;
};

// GET /api/projects/[id] のレスポンス型
export type ProjectDetailResponse = {
  id: string;
  createdAt: string;
  prefecture: { name: string };
  city: string | null;
  title: string;
  investigationSummary: string | null;
  investigationDetails: string | null;
  workStartDate: string | null;
  workEndDate: string | null;
  rewardYen: number | null;
  paymentCycle: string | null;
  status: "open" | "completed";
  company: {
    name: string;
    prefecture: string;
    city: string | null;
    address: string | null;
    representativeName: string | null;
    employeeCount: number | null;
    websiteUrl: string | null;
    description: string | null;
  } | null;
  hasApplied: boolean;
};