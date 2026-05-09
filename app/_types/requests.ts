// POST /api/requests に送るリクエストの型
export type CreateRequestRequest = {
  prefectureId: number;
  city?: string;
  title: string;
  investigationSummary?: string;
  investigationDetails?: string;
  availableStartDate?: string; // "2026-01-31" 形式
  availableEndDate?: string;   // "2026-01-31" 形式
  rewardMinYen?: number;
  paymentCycle?: string;
};

// POST /api/requests のレスポンス型
export type CreateRequestResponse = {
  id: string;
};

// GET /api/requests/[id] のレスポンス型
export type RequestDetailResponse = {
  id: string;
  created_at: string;
  prefecture: { name: string };
  city: string | null;
  title: string;
  investigationSummary: string | null;
  investigationDetails: string | null;
  availableStartDate: string | null;
  availableEndDate: string | null;
  rewardMinYen: number | null;
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
};