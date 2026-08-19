// YouTube の視聴URLから、埋め込み(iframe)用のURLを組み立てる。
// 対応形式: watch?v=ID / youtu.be/ID / embed/ID / shorts/ID
//
// なぜIDを取り出して作り直すのか:
// 貼り付けられたURLをそのまま iframe の src に渡すと、YouTube以外の
// 任意サイトを埋め込めてしまう。動画ID(英数字・ハイフン・アンダースコアの
// 11文字)だけを抜き出し、YouTube公式の embed URL を自前で組み立てることで
// 不正な埋め込みを防ぐ。
// 有効なIDを取り出せなければ null を返す（＝画面では非表示になる）。
export function getYouTubeEmbedUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  // 各URL形式から動画ID（11文字）を探すための正規表現
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,       // https://www.youtube.com/watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/,  // https://youtu.be/ID
    /\/embed\/([A-Za-z0-9_-]{11})/,    // https://www.youtube.com/embed/ID
    /\/shorts\/([A-Za-z0-9_-]{11})/,   // https://www.youtube.com/shorts/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}
