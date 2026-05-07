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