// API が失敗を返したときに、画面に出す文を選ぶ。
//
// 返事は、電工くんの API が作ったもの（{ error: "文" }）とは限らない。
// Vercel の Firewall の回数制限で止められたときは、電工くんの API に届く前に Vercel が返事を作り、
// 画面からの送信（Content-Type が JSON）には { error: { code, message, id } } の形で返す。
// これをそのまま画面に出すと、React が文として表示できずにページごと落ちる。
// そのため、error が文のときだけ使い、それ以外は 429 なら待つ目安の文、ほかは画面ごとに決めた文を出す。

// 回数制限で止められたときに出す文。止まるのは長くても10分なので、待つ目安として伝える
const TOO_MANY_REQUESTS_MESSAGE =
  "短い時間に何度も送信されたため、一時的に受け付けを止めています。10分ほどたってから、もう一度お試しください";

export function getApiErrorMessage(res: Response, json: unknown, fallback: string): string {
  // 電工くんの API が返した文は、そのまま出す
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof json.error === "string"
  ) {
    return json.error;
  }
  // 電工くんの API は 429 を返さないので、429 は Vercel の Firewall の回数制限で止められたとき
  if (res.status === 429) {
    return TOO_MANY_REQUESTS_MESSAGE;
  }
  return fallback;
}
