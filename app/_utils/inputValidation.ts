import {
  APPLICATION_MESSAGE_MAX_LENGTH,
  COMPANY_TEXT_MAX_LENGTH,
  POST_TEXT_MAX_LENGTH,
  PREFECTURE_ID_MAX,
  PREFECTURE_ID_MIN,
  REWARD_YEN_MAX,
} from "@/app/_constants/inputLimits";

// API に届いた値の型と長さを、DB に渡す前に確かめる関数。
// 画面を通さずに API を直接呼ばれると、型の違う値や非常に長い文字列が届くことがある。
// そのまま DB に渡すと 500 になったり、巨大な文字列が保存されて一覧が重くなったりするので、ここで 400 にする。
// どの関数も、問題があれば画面に出すエラーメッセージ、問題なければ null を返す（companyValidation.ts と同じ形）

// JSON の中身が「項目名 → 値」の形（オブジェクト）か。null・配列・文字列などは false
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 必須の文字列：文字列であること、空白だけでないこと、上限以内であること
export function getRequiredTextError(value: unknown, label: string, maxLength: number): string | null {
  if (typeof value !== "string" || value.trim() === "") return `${label}を入力してください`;
  if (value.length > maxLength) return `${label}は${maxLength}文字以内で入力してください`;
  return null;
}

// 任意の文字列：未入力（undefined・null）は通す。文字列以外と、上限を超える長さはエラー
export function getOptionalTextError(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return `${label}の入力内容が正しくありません`;
  if (value.length > maxLength) return `${label}は${maxLength}文字以内で入力してください`;
  return null;
}

// 任意の日付（"2026-01-31" の形）：未入力（undefined・null・空文字）は通す。
// 2月31日のような存在しない日付は、Date に変換すると別の日にずれるので、変換後に同じ日付かも確かめる
export function getOptionalDateError(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${label}の日付が正しくありません`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return `${label}の日付が正しくありません`;
  }
  return null;
}

// 都道府県の ID か（prefectures テーブルの id の範囲の整数）
export function isPrefectureId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= PREFECTURE_ID_MIN &&
    value <= PREFECTURE_ID_MAX
  );
}

// 報酬金額：1円以上・上限以下の整数
export function getRewardYenError(value: unknown): string | null {
  if (value === undefined || value === null || (typeof value === "number" && Number.isNaN(value))) {
    return "報酬金額を入力してください";
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > REWARD_YEN_MAX) {
    return `報酬金額は1円以上${REWARD_YEN_MAX.toLocaleString()}円以下の整数で入力してください`;
  }
  return null;
}

// 案件・依頼待ちで共通の自由記入欄（タイトル・市区町村・詳細・メモ・支払サイクル）。
// 詳細の欄は、案件と依頼待ちで画面の項目名が違うので、エラーメッセージ用の名前を受け取る
function getPostTextError(body: Record<string, unknown>, summaryLabel: string): string | null {
  return (
    getRequiredTextError(body.title, "タイトル", POST_TEXT_MAX_LENGTH.title) ??
    getOptionalTextError(body.city, "市区町村", POST_TEXT_MAX_LENGTH.city) ??
    getOptionalTextError(body.summary, summaryLabel, POST_TEXT_MAX_LENGTH.summary) ??
    getOptionalTextError(body.note, "メモ・備考", POST_TEXT_MAX_LENGTH.note) ??
    getOptionalTextError(body.paymentCycle, "支払サイクル", POST_TEXT_MAX_LENGTH.paymentCycle)
  );
}

// 案件の作成・更新（POST /api/projects、PUT /api/projects/[id]）の入力チェック。
// 報酬の決め方と金額は、決め方によって必須かどうかが変わるので route 側で確かめる
export function getProjectInputError(body: unknown): string | null {
  if (!isRecord(body)) return "入力内容が正しくありません";
  if (!isPrefectureId(body.prefectureId)) return "都道府県を選択してください";
  return (
    getPostTextError(body, "案件詳細") ??
    getOptionalDateError(body.workStartDate, "作業開始日") ??
    getOptionalDateError(body.workEndDate, "作業終了日")
  );
}

// 依頼待ちの作成・更新（POST /api/requests、PUT /api/requests/[id]）の入力チェック
export function getRequestInputError(body: unknown): string | null {
  if (!isRecord(body)) return "入力内容が正しくありません";
  const ids = body.prefectureIds;
  if (!Array.isArray(ids) || ids.length === 0) return "都道府県を1つ以上選択してください";
  if (ids.length > PREFECTURE_ID_MAX || !ids.every(isPrefectureId)) {
    return "都道府県の選択内容が正しくありません";
  }
  return (
    getPostTextError(body, "依頼があれば受注できる内容") ??
    getOptionalDateError(body.availableStartDate, "対応可能開始日") ??
    getOptionalDateError(body.availableEndDate, "対応可能終了日")
  );
}

// 応募のメッセージ（任意）。
// JSON として読めない body は、応募の API が空のオブジェクトに置き換えてから渡すので、ここではオブジェクト以外を誤りとして扱う
export function getApplicationMessageError(body: unknown): string | null {
  if (!isRecord(body)) return "入力内容が正しくありません";
  return getOptionalTextError(body.message, "メッセージ", APPLICATION_MESSAGE_MAX_LENGTH);
}

// 自社情報の保存（PUT /api/companies/me）の型と長さのチェック。
// 必須かどうか・電話番号やメールの形式・施工体制と資格は、route にある既存のチェックで確かめる
export function getCompanyInputError(body: unknown): string | null {
  if (!isRecord(body)) return "入力内容が正しくありません";
  if (!isPrefectureId(body.prefectureId)) return "都道府県を選択してください";
  const limits = COMPANY_TEXT_MAX_LENGTH;
  return (
    getOptionalTextError(body.name, "会社名", limits.name) ??
    getOptionalTextError(body.city, "市区町村", limits.city) ??
    getOptionalTextError(body.address, "町名・番地・建物名", limits.address) ??
    getOptionalTextError(body.representativeName, "代表者名", limits.representativeName) ??
    getOptionalTextError(body.websiteUrl, "Webサイト URL", limits.websiteUrl) ??
    getOptionalTextError(body.description, "自社紹介", limits.description) ??
    getOptionalTextError(body.contactPhone, "電話番号", limits.contactPhone) ??
    getOptionalTextError(body.contactEmail, "連絡用メールアドレス", limits.contactEmail) ??
    getOptionalTextError(body.contactLineId, "LINE ID / 招待URL", limits.contactLineId) ??
    getOptionalTextError(body.contactNote, "その他の連絡手段", limits.contactNote)
  );
}
