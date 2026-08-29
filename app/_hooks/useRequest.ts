import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import type { RequestDetailResponse } from '@/app/_types/requests';

// 依頼詳細の取得キー(URL)と型を、ここ1箇所に集約する。用途は useProject と同じ。
export function useRequest(id: string) {
  return useAuthedFetch<RequestDetailResponse>(`/api/requests/${id}`);
}
