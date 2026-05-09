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