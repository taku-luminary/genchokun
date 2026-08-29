import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import type { ProjectDetailResponse } from '@/app/_types/projects';

// 案件詳細の取得キー(URL)と型を、ここ1箇所に集約する。
// 各ページは useProject(id) を呼ぶだけでよく、URL文字列を直書きしない。
// 戻り値の mutate はこのキー専用(bound)なので、更新は引数なしの mutate() でよい。
export function useProject(id: string) {
  return useAuthedFetch<ProjectDetailResponse>(`/api/projects/${id}`);
}
