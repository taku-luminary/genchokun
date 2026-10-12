// 応募メッセージの下書き（このタブの sessionStorage に保存する）のキーを扱う。
// キーの作り方をここにまとめ、会員が入れ替わったときに下書きだけを確実に消せるようにする

// 下書きのキーの先頭。案件への応募と依頼への応募で分け、後ろに ID を付けて混ざらないようにする
const DRAFT_KEY_PREFIXES = {
  project: "project-apply-message:",
  request: "request-apply-message:",
} as const;

// 下書きを保存するキー（例: "project-apply-message:1001"）
export function applyDraftKey(kind: keyof typeof DRAFT_KEY_PREFIXES, id: string): string {
  return `${DRAFT_KEY_PREFIXES[kind]}${id}`;
}

// このタブに残っている応募の下書きを、すべて消す。
// 会員が入れ替わったときに呼び、前の会員の下書きが次の会員の画面に出ないようにする。
// sessionStorage 全体は消さない。ほかの用途で保存された値まで消して、処理を壊さないため
export function clearApplyDrafts(): void {
  try {
    const prefixes: string[] = Object.values(DRAFT_KEY_PREFIXES);
    // 消すとキーの番号がずれるので、先に消すキーを集めてから消す
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // 保存領域が使えない設定のブラウザでは、下書きも保存されていないので何もしない
  }
}
