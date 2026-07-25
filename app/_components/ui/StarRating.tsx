// 表示専用の星評価コンポーネント（読み取り専用・小数対応）。
// 灰色の★の上に金色の★を「幅%」で重ねてクリップし、任意の小数を表現する。
// 入力用ではないので、レビュー投稿フォームの星（1〜5の離散選択）とは別物。

type StarRatingSize = "sm" | "md" | "lg";

type Props = {
  rating: number; // 平均点（例: 4.6）。0〜5想定
  count?: number; // レビュー件数。渡すと「（12件）」も表示する
  size?: StarRatingSize; // 星の大きさ（デフォルト sm）
};

// 星のサイズ（文字サイズで調整）
const SIZE_CLASS: Record<StarRatingSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function StarRating({ rating, count, size = "sm" }: Props) {
  // 0〜5の範囲に丸めてから、5個中の「塗る割合(%)」に変換する
  const clamped = Math.max(0, Math.min(5, rating));
  const fillPercent = (clamped / 5) * 100;

  // 音声読み上げ用の説明文（見た目の★は aria-hidden 相当にして、これで読ませる）
  const label =
    count !== undefined
      ? `5点満点中${clamped.toFixed(1)}点、レビュー${count}件`
      : `5点満点中${clamped.toFixed(1)}点`;

  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex items-center gap-1 whitespace-nowrap align-middle"
    >
      {/* 星本体（灰色の下地 ＋ 金色の上乗せ） */}
      <span className={`relative inline-block leading-none ${SIZE_CLASS[size]}`}>
        {/* 下地: 灰色の★5個 */}
        <span className="text-slate-300">★★★★★</span>
        {/* 上乗せ: 金色の★5個を、左から fillPercent% の幅だけ見せる（右側は overflow-hidden で隠す） */}
        <span
          className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-400"
          style={{ width: `${fillPercent}%` }}
        >
          ★★★★★
        </span>
      </span>

      {/* 数値（例: 4.6） */}
      <span className="text-slate-700 font-bold text-sm tabular-nums">
        {clamped.toFixed(1)}
      </span>

      {/* 件数（渡されたときだけ） */}
      {count !== undefined && (
        <span className="text-slate-400 text-xs">（{count}件）</span>
      )}
    </span>
  );
}
