import type { TermsAgreementRequiredResponse } from "@/app/_types/legal";

// 利用規約への同意の画面。ヘッダーの案内と、同意が必要なときの移動先に使う
export const TERMS_AGREEMENT_PATH = "/mypage/terms-agreement";

// API が「利用規約への同意が必要」で断ったときに付ける印。サーバー（断る側）と画面（受け取る側）で同じ値を使う
export const TERMS_AGREEMENT_REQUIRED_CODE: TermsAgreementRequiredResponse["code"] = "terms_agreement_required";

// API の返事が「同意が必要」の断りかを確かめる。
// 本文を読むので、確かめたあとに同じ返事の本文を使わない場所（データの取得の失敗の扱い）でだけ呼ぶ
export async function isTermsAgreementRequiredResponse(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;
  try {
    const json: unknown = await res.json();
    return typeof json === "object" && json !== null && "code" in json && json.code === TERMS_AGREEMENT_REQUIRED_CODE;
  } catch {
    // JSON として読めない 403 は、同意が必要の断りではない
    return false;
  }
}
