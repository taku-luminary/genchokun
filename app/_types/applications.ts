// 応募API（POST /api/projects/[id]/apply）のリクエスト型
// message は応募時のアピールメッセージ (任意入力)
// 販売店が後で応募者を選ぶ際の判断材料として保存される
export type CreateProjectApplicationRequest = {
  message?: string;
};

// 応募API（POST /api/projects/[id]/apply）のレスポンス型
// 成功時は { success: true }、失敗時は { error: string }
export type CreateProjectApplicationResponse =
  | { success: true }
  | { error: string };

// 応募API（POST /api/requests/[id]/apply）のリクエスト型
// message は相手へのコメント (任意入力)
export type CreateRequestApplicationRequest = {
  message?: string;
};

// 応募API（POST /api/requests/[id]/apply）のレスポンス型
// projects と同じ形に揃える
export type CreateRequestApplicationResponse =
  | { success: true }
  | { error: string };
