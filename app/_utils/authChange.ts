import { clearApplyDrafts } from "@/app/_utils/applyDraft";
import type { AuthSessionResponse } from "@/app/_types/auth";

// 会員の入れ替わり（ログイン・ログアウト・メールのリンクでのログイン）を、ブラウザ側で扱う共通の処理。
// router.push や router.refresh での画面の切り替えはページを読み込み直さないので、
// 前の会員のデータ（SWR のキャッシュや画面の状態）がメモリに残る。
// そこで会員が入れ替わったら、応募の下書きを消してから、ページ全体を読み込み直す

// 同じブラウザのほかのタブへ「ログインの状態が変わった」と知らせる通り道の名前。
// 送るのは合図だけで、会員の情報やトークンは送らない
const AUTH_CHANNEL_NAME = "auth-change";

// 読み込み直したあとの画面へ、失敗の理由（画面に出すエラー文）を引き継ぐためのキー。読んだらすぐ消す
const AUTH_ERROR_KEY = "auth-change-error";

// このページを表示したときにログインしていた会員の ID（未ログインなら null）。
// ヘッダーに置いた AuthChangeWatcher が入れる。まだ入っていないときは undefined
let pageMemberId: string | null | undefined;

export function setPageMemberId(id: string | null): void {
  pageMemberId = id;
}

let channel: BroadcastChannel | null = null;

// BroadcastChannel が無い古いブラウザでは null。そのときは、タブに戻ったときの確認（AuthChangeWatcher）で対応する
function getAuthChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(AUTH_CHANNEL_NAME);
  return channel;
}

// ほかのタブからの合図を受け取る。戻り値は、受け取りをやめる関数
export function onAuthChangeNotice(listener: () => void): () => void {
  const authChannel = getAuthChannel();
  if (!authChannel) return () => {};
  authChannel.addEventListener("message", listener);
  return () => authChannel.removeEventListener("message", listener);
}

// いまログインしている会員が、このページを表示したときの会員と違うかを、サーバーに問い合わせて確かめる。
// 通信できないなどで確かめられないときは false（変わっていない扱い）にする。
// 確かめられないだけで読み込み直すと、入力中の内容や下書きを消してしまうため
export async function hasMemberChanged(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const json: AuthSessionResponse = await res.json();
    if (!res.ok || !("userId" in json)) return false;
    // 表示したときの会員がまだ分からない（undefined）ときも、安全のため「変わった」扱いになる
    return json.userId !== pageMemberId;
  } catch {
    return false;
  }
}

// 会員が入れ替わったときに呼ぶ。ほかのタブへ知らせ、このタブの下書きを消してから、
// ページ全体を読み込み直して path を開く。
// errorMessage を渡すと、読み込み直したあとの画面でそのエラー文を出す
// （処理は失敗したが、途中でログインの状態だけ変わったとき）
export function reloadAfterAuthChange(path: string, errorMessage?: string): void {
  getAuthChannel()?.postMessage("changed");
  clearApplyDrafts();
  if (errorMessage) {
    try {
      sessionStorage.setItem(AUTH_ERROR_KEY, errorMessage);
    } catch {
      // 保存領域が使えない設定のブラウザでも、読み込み直しは必ず行う（エラー文だけ出せなくなる）
    }
  }
  // replace にして、入れ替わる前の画面を「戻る」の履歴に増やさない
  window.location.replace(path);
}

// 読み込み直す前の画面から引き継いだエラー文を取り出す（1回だけ）。無ければ null
export function takeAuthChangeError(): string | null {
  try {
    const message = sessionStorage.getItem(AUTH_ERROR_KEY);
    if (message !== null) sessionStorage.removeItem(AUTH_ERROR_KEY);
    return message;
  } catch {
    return null;
  }
}
