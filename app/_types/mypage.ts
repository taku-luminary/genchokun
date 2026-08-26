import type { CompanyContact, CompanyInfo } from "./companies";
import type { HomeProject, HomeRequest } from "./home";
import type { CompanyRatingSummary } from "@/app/_libs/companyRatings";
import type { ReviewCardInfo } from "./reviews";
import type { RewardType } from "./projects";

export type MypageApiResponse = {
  stats: {
    todoCount: number;
    // 掲載した案件すべて = 工事案件 + お仕事待ち
    postedCount: number;
    // 応募した案件すべて = 工事案件 + お仕事待ち
    appliedCount: number;
    // 自分がまだ書いていないレビュー（レビュー待ち）の合計件数
    reviewPendingCount: number;
    // 新しくマッチング（active・自分が未読・レビュー待ちでない）の合計件数
    newMatchCount: number;
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
  summary: string | null;
  paymentCycle: string | null;
  rewardType: RewardType;
  rewardYen: number | null;
  status: "open" | "completed";
  companyName: string | null;
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略
  reviewPending?: boolean;           // この案件のマッチがレビュー待ちか
  newMatch?: boolean;                // 新しくマッチング（active・自分が未読・レビュー待ちでない）
  activeMatchId?: string | null;     // activeマッチのID（既読POST用）。無ければ null
  matches: { status: string }[];
};

// 工事店依頼1件の型
export type MypageRequest = {
  id: string;
  createdAt: string;
  prefectures: { name: string }[]; // 対応可能エリア（複数）
  city: string | null;
  title: string;
  availableStartDate: string | null;
  availableEndDate: string | null;
  summary: string | null;
  paymentCycle: string | null;
  rewardType: RewardType;
  rewardMinYen: number | null;
  status: "open" | "completed";
  companyName: string | null;
  companyRating?: CompanyRatingSummary | null; // 相手企業の評価。未取得なら省略
  reviewPending?: boolean;           // この依頼のマッチがレビュー待ちか
  newMatch?: boolean;                // 新しくマッチング
  activeMatchId?: string | null;     // activeマッチのID（既読POST用）。無ければ null
  match: { status: string } | null;
};


// 詳細ページ専用: 一覧用 MypageProject に「メモ・備考(note)」と「掲載元(自社)情報」を足したもの。
// 一覧API/ProjectCard に影響を出さないよう、一覧型は変えず詳細だけ拡張する。
export type MypageProjectDetail = MypageProject & {
  note: string | null;
  company: CompanyInfo | null;
};

// 詳細レスポンスは MypageProjectDetail を使う（ProjectCard には上位互換でそのまま渡せる）
export type MypageProjectDetailResponse =
  | {
      project: MypageProjectDetail;
      applications: ProjectApplication[];
      reviewCard: ReviewCardInfo | null;
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
    companyId: string | null;
    companyName: string | null;
    companyRating?: CompanyRatingSummary | null; // 応募者企業の評価（0件なら null）
    prefecture: string | null;
    contact: CompanyContact | null;
  };
};


// 自分が工事店として応募した project 1件分
export type AppliedProject = {
  /** 応募(match)のID。一覧表示の key に使う */
  matchId: string;
  /** 自分の応募の状態 */
  myStatus: "pending" | "active" | "rejected" | "cancelled";
  /** このマッチがレビュー待ちか（project の中ではなく兄弟に置く） */
  reviewPending?: boolean;
  newMatch?: boolean;   // 新しくマッチング（既読POSTには既存の matchId を使う）
  project: HomeProject;
};

// 自分が販売店として応募した request 1件分
// (request は応募＝即マッチなので myStatus は基本 "active" だが、型は project と揃える)
export type AppliedRequest = {
  matchId: string;
  myStatus: "pending" | "active" | "rejected" | "cancelled";
  /** このマッチがレビュー待ちか（request の中ではなく兄弟に置く） */
  reviewPending?: boolean;
  newMatch?: boolean;   // 新しくマッチング
  request: HomeRequest;
};
