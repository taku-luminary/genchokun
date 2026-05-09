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

// SWR = 指定したキーが変わったら、fetcherを実行してデータを取り直してくれる仕組み
// useSWRは、第1引数のキーが変わると、fetcherを実行する。
// fetcherの第1引数には、useSWRの第1引数のキーがそのまま渡される。
// fetcherは、そのキーを使ってfetchを実行する。
// 取得結果は data に入り、失敗したら error に入り、 取得中かどうかは isLoading に入る
// ※今回はカスタムフックにしているのでfetcher を渡す必要がない


// useAuthedFetch('/api/home') を呼んだ瞬間
// ↓
// useSWR が即座に返すもの：
// { data: undefined, isLoading: true, error: undefined }
// ↓ 裏で fetch が走っている...
// fetch 完了！React が再レンダリング
// ↓
// useSWR が返すもの（自動更新）：
// { data: { projects: [...] }, isLoading: false, error: undefined }

// 「最終的な値を待ってから返す」のではなく、「今の状態スナップショット」を即座に返して、完了したら自動で更新するという仕組みです。
// useStateと同じように状態管理をしていて値が変更されたら更新される