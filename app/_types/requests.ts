import type { CompanyContact } from "./companies";

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
  createdAt: string;
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
  // ログイン中ユーザー(販売店)が既にこの依頼に応募済みか (自分視点)
  hasApplied: boolean;
  // この依頼が既に誰かとマッチング成立しているか (依頼視点)
  // 1依頼=1マッチなので、true なら他のユーザーは応募不可
  isMatched: boolean;
  // ▼ 追加: 自分がこの依頼の投稿者（=工事店）か。投稿者にだけ販売店の連絡先を渡すため。
  isMyRequest: boolean;
  // ▼ 追加: 自分が応募してマッチした場合の「工事店（投稿者）」の連絡先。
  //         hasApplied && isMatched 以外は null。
  contractorContact: CompanyContact | null;
  // ▼ 追加: 自分の依頼にマッチが入った場合の「販売店（応募者）」の連絡先。
  //         isMyRequest && isMatched 以外は null。
  salesContact: CompanyContact | null;
};
