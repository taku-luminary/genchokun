// 企業ページに公開される会社情報の短い説明。
// 同意の前に公開の範囲（番地・建物名・代表者名も誰でも見られること、検索エンジン、連絡先はマッチングの相手だけ）を示すため、
// 会員登録の確認画面と利用規約への同意の画面で同じ文を出す
export function CompanyPublicInfoNotice() {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-left">
      <p className="text-sm font-bold text-slate-600">企業ページに公開される情報</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        会社名・所在地（番地・建物名まで）・代表者名などの会社情報は、誰でも見られる企業ページに公開され、検索エンジンにも表示されることがあります。連絡先は、マッチングが成立した相手にだけ表示されます。
      </p>
    </div>
  );
}
