import type { CompanyContact } from "./companies";

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
  // ▼ 変更: hasApplied を廃止し、ログイン中ユーザーの match 状態を4値で持つ。
  //   null:      未応募
  //   pending:   応募済み、販売店の決定待ち
  //   active:    自分が選ばれた（マッチ成立）
  //   rejected:  他の応募者が選ばれた（落選）
  myMatchStatus: "pending" | "active" | "rejected" | null;
  // ▼ 追加: ログイン中ユーザーがこの案件の掲載者本人かどうか
  isMyProject: boolean;
  // ▼ 追加: myMatchStatus === "active" のときだけ、案件投稿者（販売店）の連絡先を入れる。
  //         他の状態では null（プライバシー保護）。
  salesContact: CompanyContact | null;
};
