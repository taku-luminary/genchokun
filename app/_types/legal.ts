// 法務文書（利用規約・プライバシーポリシー）の構造。
// 本文を定数データとして持ち、描画は LegalDocument に任せることで、
// 文言の改定を「定数ファイルの文字を直して push」だけで済ませる。
// git の履歴がそのまま改定履歴になり、民法548条の4 が求める周知の証跡にもなる。

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalDocument = {
  title: string;
  // 改定したら上げる。利用規約では、同意の記録（terms_agreements.termsVersion）と突き合わせる識別子にもなる
  version: string;
  // 最終改定日（その版を公開した日）。YYYY-MM-DD 形式。制定日は git の履歴に残り、利用規約は附則にも書く
  revisedAt: string;
  sections: LegalSection[];
};

// 利用規約に同意した画面。同意の記録（terms_agreements.source）に残し、どの画面の表示を見て同意したかを後から確かめられるようにする
// - "signup_confirm"：会員登録の確認画面（会員のメールに届くリンクから開く。app/auth/confirm）
// - "consent_page"：ログイン後の同意の画面（ヘッダーの案内から開く。app/mypage/terms-agreement）
export type TermsAgreementSource = "signup_confirm" | "consent_page";
