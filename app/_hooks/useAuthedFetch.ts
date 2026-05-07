import useSWR from 'swr';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
    // fetch() は、method を書かない場合、デフォルトでmethodは GETリクエスト になります。
  if (!res.ok) throw new Error("データの取得に失敗しました");
  return res.json();
};

export function useAuthedFetch<T>(url: string) {
  return useSWR<T>(url, fetcher);
}