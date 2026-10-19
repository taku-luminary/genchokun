import type { NextRequest } from "next/server";

// 電工くんの画面以外から送られた操作を断るときに返すメッセージ
export const NOT_SAME_ORIGIN_MESSAGE =
  "送信を受け付けられませんでした。ページを読み込み直して、もう一度お試しください";

// 電工くんの画面から送られた操作かを確かめる（CSRF 対策）。同意の記録・メールの確認・ログインの API の最初で呼ぶ。
// - ブラウザが自動で付ける Sec-Fetch-Site・Origin のどちらかが、よその画面からの送信を示したら断る（same-site でも、同じオリジンでなければ断る）
// - どちらも付いていない送信は、送信元では判断しない（安全とはみなさない）。代わりに JSON の形式を必須にして、
//   よその画面のフォームなどからの送信を止める（よそのオリジンへ JSON の形式で送るには送信先の CORS の許可が要り、電工くんは許可していない）
// Origin と比べる自分のホストは、Next.js の Server Actions の確認と同じく x-forwarded-host（無ければ host）から取る
export function isSameOriginJsonRequest(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin !== null) {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host");
    if (!host || toHost(origin) !== host) {
      return false;
    }
  }

  const contentType = request.headers.get("content-type") ?? "";
  return contentType.split(";")[0].trim().toLowerCase() === "application/json";
}

// Origin から「ホスト名:ポート」を取り出す。"null" など URL として読めない値は null にして、一致しないものとして扱う
function toHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}
