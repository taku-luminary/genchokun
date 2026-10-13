// 利用規約への同意の画面（app/mypage/terms-agreement/）と API（app/api/account/terms-agreement/）で使う型。
// この機能の中でしか使わないため、グローバルの app/_types ではなく機能フォルダに置く

// POST /api/account/terms-agreement のリクエスト型。同意のボタンが押されたときだけ送る
export type TermsAgreementRequest = {
  agreed: true;
};

// POST /api/account/terms-agreement のレスポンス型
// 成功時は { success: true }、失敗時は { error: "画面に出すメッセージ" }
export type TermsAgreementResponse = { success: true } | { error: string };
