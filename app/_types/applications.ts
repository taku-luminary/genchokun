// 応募API（POST /api/projects/[id]/apply）のレスポンス型
// 成功時は matchId（作成された matches テーブルの行ID）
// 失敗時は error（エラーメッセージ）
export type CreateProjectApplicationResponse =
  | { matchId: string }
  | { error: string };