import type { CompanyContact, CompanyInfo } from "./companies";
// ▼ 追加: 応募した案件一覧はホームと同じカード型を使い回す
import type { HomeProject, HomeRequest } from "./home";
// /api/mypage が返すデータ全体の型
import type { CompanyRatingSummary } from "@/app/_libs/companyRatings";

export type MypageApiResponse = {
  stats: {
    todoCount: number;
    // ▼ 変更: projectCount → postedCount（掲載した案件すべて = 工事案件 + お仕事待ち）
    postedCount: number;
    // ▼ 変更: applicationCount → appliedCount（応募した案件すべて = 工事案件 + お仕事待ち）
    appliedCount: number;
  };
  projects: MypageProject[];
  requests: MypageRequest[];
  appliedProjects: AppliedProject[];
  appliedRequests: AppliedRequest[];
};

// 工事案件1件の型
export type MypageProject = {
  id: string;
  createdAt: string;
  prefecture: { name: string };
  city: string | null;
  title: string;
  workStartDate: string | null;
  workEndDate: string | null;
  investigationSummary: string | null;
  paymentCycle: string | null;
  rewardYen: number | null;
  status: "open" | "completed";
  companyName: string | null;        // ← 追加（Cards.tsx と整合させる）
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略
  matches: { status: string }[];
};

// 工事店依頼1件の型
export type MypageRequest = {
  id: string;
  createdAt: string;
  prefectures: { name: string }[]; // 対応可能エリア（複数）
  city: string | null;
  title: string;                      // ← null許容を外す（HomeRequest と統一）
  availableStartDate: string | null;
  availableEndDate: string | null;
  investigationSummary: string | null;
  paymentCycle: string | null;
  rewardMinYen: number | null;
  status: "open" | "completed";
  companyName: string | null;        // ← 追加
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略
  match: { status: string } | null;
};


// 詳細ページ専用: 一覧用 MypageProject に「調査詳細」と「投稿元(自社)情報」を足したもの。
// 一覧API/ProjectCard に影響を出さないよう、一覧型は変えず詳細だけ拡張する。
export type MypageProjectDetail = MypageProject & {
  investigationDetails: string | null;
  company: CompanyInfo | null;
};

// 詳細レスポンスは MypageProjectDetail を使う（ProjectCard には上位互換でそのまま渡せる）
export type MypageProjectDetailResponse =
  | {
      project: MypageProjectDetail;
      applications: ProjectApplication[];
    }
  | { error: string };

// 応募1件分（決定ボタンを押すために matchId が必要）
// status は match_status enum: "pending" | "active" | "rejected" | "cancelled"
export type ProjectApplication = {
  matchId: string;
  status: "pending" | "active" | "rejected" | "cancelled";
  message: string | null;
  appliedAt: string;
  contractor: {
    userId: string;
    companyId: string | null;        // ← 追加: 応募者の企業ページ用（未登録なら null）
    companyName: string | null;
    prefecture: string | null;
    // ▼ 追加: マッチ成立（status === "active"）の応募者にだけ連絡先を入れる。
    //         pending/rejected/cancelled の場合は null。プライバシー保護のため。
    contact: CompanyContact | null;
  };
};

// ▼ 追加: 自分が工事店として応募した project 1件分
export type AppliedProject = {
  /** 応募(match)のID。一覧表示の key に使う */
  matchId: string;
  /** 自分の応募の状態 */
  myStatus: "pending" | "active" | "rejected" | "cancelled";
  /** カード表示用。ProjectCard を再利用するため HomeProject と同じ形で受け取る */
  project: HomeProject;
};

// ▼ 追加: 自分が販売店として応募した request 1件分
// (request は応募＝即マッチなので myStatus は基本 "active" だが、型は project と揃える)
export type AppliedRequest = {
  matchId: string;
  myStatus: "pending" | "active" | "rejected" | "cancelled";
  request: HomeRequest;
};