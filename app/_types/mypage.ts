import type { CompanyContact } from "./companies";

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
  matches: { status: string }[];
};

// 工事店依頼1件の型
export type MypageRequest = {
  id: string;
  createdAt: string;
  prefecture: { name: string };
  city: string | null;
  title: string;                      // ← null許容を外す（HomeRequest と統一）
  availableStartDate: string | null;
  availableEndDate: string | null;
  investigationSummary: string | null;
  paymentCycle: string | null;
  rewardMinYen: number | null;
  status: "open" | "completed";
  companyName: string | null;        // ← 追加
  match: { status: string } | null;
};

// 詳細レスポンスでも一覧と同じ MypageProject を使う
// (ProjectCard をそのまま再利用するため)
export type MypageProjectDetailResponse =
  | {
      project: MypageProject;
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
    companyName: string | null;
    prefecture: string | null;
    // ▼ 追加: マッチ成立（status === "active"）の応募者にだけ連絡先を入れる。
    //         pending/rejected/cancelled の場合は null。プライバシー保護のため。
    contact: CompanyContact | null;
  };
};
