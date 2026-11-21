// 法務文書（利用規約・プライバシーポリシー）の構造。
// 本文を定数データとして持ち、描画は LegalDocument に任せることで、
// 文言の改定を「定数ファイルの文字を直して push」だけで済ませる。
// git の履歴がそのまま改定履歴になり、民法548条の4 が求める周知の証跡にもなる。

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

// 公開した版ごとの記録。app/_constants/legal/revisions.ts に古い順に並べる。
// 公開した版の行の版・公開日・効力発生日は書き換えない（本文を直すときは版を上げて行を足す）
export type LegalRevision = {
  version: string; // 画面に出す版（例 "1.1"）
  publishedAt: string; // 公開日＝本番に反映した日（YYYY-MM-DD、日本時間）。文書の「最終改定日」にも使う
  effectiveAt: string; // 効力発生日（YYYY-MM-DD）。画面に出すのは、利用規約で公開日と違う版だけ
};

// 利用規約の版だけが持つ設定
export type TermsRevision = LegalRevision & {
  // この版で、すでに同意した会員にも同意をお願いし直すか。
  // true にした最後の版から今の版までのどれかに同意していれば、ヘッダーの案内は出ない
  asksAgreement: boolean;
};

export type LegalDocument = {
  title: string;
  // 公開した版（古い順）。最後の行が今の版で、画面の版・最終改定日・効力発生日もここから作る
  revisions: LegalRevision[];
  // 効力発生日を、版の行の下に出す文書か（利用規約だけ true）。会員が同意する文書なので、同意した会員への適用の時期も一緒に出す
  showsEffectiveDate?: boolean;
  sections: LegalSection[];
};

// 利用規約に同意した画面。同意の記録（terms_agreements.source）に残し、どの画面の表示を見て同意したかを後から確かめられるようにする
// - "signup_confirm"：会員登録の確認画面（会員のメールに届くリンクから開く。app/auth/confirm）
// - "consent_page"：ログイン後の同意の画面（ヘッダーの案内から開く。app/mypage/terms-agreement）
export type TermsAgreementSource = "signup_confirm" | "consent_page";

// 第1.1版の利用制限で、利用規約への同意が必要な会員の操作を API が断るときの返事（403）。
// code の印で、ログインしていない（401）・自社情報が未登録（403）などの断りと区別する
export type TermsAgreementRequiredResponse = {
  error: string;
  code: "terms_agreement_required";
};
