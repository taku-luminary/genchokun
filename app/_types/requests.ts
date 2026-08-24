import type { CompanyContact, CompanyInfo } from "./companies";
import type { ReviewCardInfo } from "./reviews";
import type { RewardType } from "./projects";

// POST /api/requests に送るリクエストの型
export type CreateRequestRequest = {
  prefectureIds: number[]; // 対応可能エリア（複数選択）。1件以上必須
  city?: string;
  title: string;
  summary?: string;
  note?: string;
  availableStartDate?: string; // "2026-01-31" 形式
  availableEndDate?: string;   // "2026-01-31" 形式
  rewardType: RewardType;   // 必須。金額指定(fixed) か 見積もり希望(negotiable) を選ぶ
  rewardMinYen?: number;    // rewardType === "fixed" のときだけ入る
  paymentCycle?: string;
};
// PUT /api/requests/[id] のリクエスト型。
// 編集フォームの入力項目は新規作成と同じなので CreateRequestRequest を再利用する。
export type UpdateRequestRequest = CreateRequestRequest;

// POST /api/requests のレスポンス型
export type CreateRequestResponse = {
  id: string;
};

// GET /api/requests/[id] のレスポンス型
export type RequestDetailResponse = {
  id: string;
  createdAt: string;
  // 対応可能エリア（複数）。id は編集フォームの初期値用、name は表示用
  prefectures: { id: number; name: string }[];
  city: string | null;
  title: string;
  summary: string | null;
  note: string | null;
  availableStartDate: string | null;
  availableEndDate: string | null;
  rewardType: RewardType;
  rewardMinYen: number | null;
  paymentCycle: string | null;
  status: "open" | "completed";
  company: CompanyInfo | null;

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
    // ▼ 追加: ログイン中ユーザーがこの依頼を「今」編集/削除できるか。
  //   投稿者本人 && status === "open"（＝まだマッチが入っていない）のときだけ true。
  isEditable: boolean;
    // ▼ 追加: マッチカードのレビュー状態（応募者視点・投稿者視点どちらでも同じ形で表現）。
    reviewCard: ReviewCardInfo | null;

};
