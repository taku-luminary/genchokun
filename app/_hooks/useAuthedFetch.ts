import useSWR from 'swr';
import { isTermsAgreementRequiredResponse, TERMS_AGREEMENT_PATH } from '@/app/_utils/termsAgreement';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
    // fetch() は、method を書かない場合、デフォルトでmethodは GETリクエスト になります。
  if (!res.ok) {
    // 利用規約への同意が必要な会員が、同意のあとに見られるデータ（当事者でない募集の詳細）を開いたときは、同意の画面へ移す（第1.1版の利用制限）。
    // ここはフックの外で router を使えないので、ページ全体を読み込み直して移る（ヘッダーの案内も新しくなる）。
    // 移るまでのあいだは「取得に失敗しました」を出さず、読み込み中のままにする（終わらない Promise を返す）
    if (await isTermsAgreementRequiredResponse(res)) {
      window.location.replace(TERMS_AGREEMENT_PATH);
      return new Promise<T>(() => {});
    }
    throw new Error("データの取得に失敗しました");
  }
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
// { data:APIが返したJSON, isLoading: false, error: undefined }

// 「最終的な値を待ってから返す」のではなく、「今の状態スナップショット」を即座に返して、完了したら自動で更新するという仕組みです。
// useStateと同じように状態管理をしていて値が変更されたら更新される