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
  // 改定したら上げる。同意記録（将来）と突き合わせるための識別子
  version: string;
  // 最終改定日（その版を公開した日）。YYYY-MM-DD 形式。制定日は git の履歴に残り、利用規約は附則にも書く
  revisedAt: string;
  sections: LegalSection[];
};
