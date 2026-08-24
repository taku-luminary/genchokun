import type { CompanyContact, CompanyInfo } from "./companies";
import type { ReviewCardInfo } from "./reviews";
export type RewardType = "fixed" | "negotiable";

export type CreateProjectRequest = {
  prefectureId: number;
  city?: string;
  title: string;
  summary?: string;
  note?: string;
  workStartDate?: string; // "2026-01-31" 形式
  workEndDate?: string;
  rewardType: RewardType;   // 必須。フォームで必ずどちらかを選ぶ
  rewardYen?: number;       // rewardType === "fixed" のときだけ入る
  paymentCycle?: string;
};

// POST /api/projects のレスポンス型
export type CreateProjectResponse = {
  id: string;
};

// PUT /api/projects/[id] のリクエスト型。
// 編集フォームの入力項目は新規作成と同じなので CreateProjectRequest を再利用する。
export type UpdateProjectRequest = CreateProjectRequest;

// GET /api/projects/[id] のレスポンス型
export type ProjectDetailResponse = {
  id: string;
  createdAt: string;
  prefecture: { name: string };
  // ▼ 追加: 編集フォームの都道府県プルダウンの初期選択に使う
  prefectureId: number;
  city: string | null;
  title: string;
  summary: string | null;
  note: string | null;
  workStartDate: string | null;
  workEndDate: string | null;
  rewardType: RewardType;
  rewardYen: number | null;
  paymentCycle: string | null;
  status: "open" | "completed";
  company: CompanyInfo | null;
  // ▼  hasApplied を廃止し、ログイン中ユーザーの match 状態を4値で持つ。
  //   null:      未応募
  //   pending:   応募済み、販売店の決定待ち
  //   active:    自分が選ばれた（マッチ成立）
  //   rejected:  他の応募者が選ばれた（落選）
  myMatchStatus: "pending" | "active" | "rejected" | null;
  // ▼ ログイン中ユーザーがこの案件の掲載者本人かどうか
  isMyProject: boolean;
  // ▼ myMatchStatus === "active" のときだけ、案件投稿者（販売店）の連絡先を入れる。
  //         他の状態では null（プライバシー保護）。
  salesContact: CompanyContact | null;
  // ▼ ログイン中ユーザーがこの案件を「今」編集できるか。
  //   投稿者本人 && status === "open" && 応募が1件も無い、のときだけ true。
  //   詳細ページの編集/削除ボタンの表示制御に使う（サーバー側でも必ず再チェックする）。
  isEditable: boolean;
    // ▼ 追加: マッチカードのレビュー状態。自分がこの案件でマッチ成立した場合のみ入り、
  //   それ以外は null（レビューの流れに乗らない＝従来通りの表示）。
  reviewCard: ReviewCardInfo | null;
}