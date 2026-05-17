// 応募API（POST /api/projects/[id]/apply）のレスポンス型
// 成功時は matchId（作成された matches テーブルの行ID）
// 失敗時は error（エラーメッセージ）
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