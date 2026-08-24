import type { CompanyRatingSummary } from "@/app/_libs/companyRatings";
import type { RewardType } from "./projects";

export type HomeProject = {
  id: string;
  createdAt: string;
  prefecture: { name: string };
  city: string | null;
  title: string;
  workStartDate: string | null;
  workEndDate: string | null;
  rewardType: RewardType;
  rewardYen: number | null;
  paymentCycle: string | null;
  status: "open" | "completed";
  companyName: string | null; // 発注者の会社名
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略、レビュー0件なら null
};

export type HomeRequest = {
  id: string;
  createdAt: string;
  prefectures: { name: string }[]; // 対応可能エリア（複数）
  city: string | null;
  title: string; // 追加
  availableStartDate: string | null;
  availableEndDate: string | null;
  summary: string | null;
  paymentCycle: string | null;
  rewardType: RewardType;
  rewardMinYen: number | null;
  status: "open" | "completed";
  companyName: string | null;
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略、レビュー0件なら null
};

export type HomeApiResponse = {
  projects: HomeProject[];
  requests: HomeRequest[];
  totalProjects: number; // 案件の総件数（ページネーション用）
  totalRequests: number; // 依頼待ちの総件数（ページネーション用）
};