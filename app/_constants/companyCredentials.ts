// 施工体制・資格の自由記入欄（工事区分／経験年数、その他の資格、保険の内容、施工ID・メーカー認定）の文字数上限。
// フォームの maxLength と API のチェックで同じ値を使い、画面では入力できるのに保存で弾かれる食い違いを防ぐ
export const CREDENTIAL_TEXT_MAX_LENGTH = 500;