import { getYouTubeEmbedUrl } from "@/app/_utils/youtube";

type YouTubeEmbedProps = {
  url: string | null | undefined; // YouTube の視聴URL（未設定・不正なら何も表示しない）
  title?: string;                 // iframe のタイトル（アクセシビリティ用）
  className?: string;             // 余白など、呼び出し側でのレイアウト調整用
};

// YouTube の視聴URLを 16:9 レスポンシブで埋め込み表示する汎用コンポーネント。
// URLから動画IDを取り出せない場合は null を返し、何も描画しない。
export function YouTubeEmbed({
  url,
  title = "YouTube動画",
  className,
}: YouTubeEmbedProps) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className={`aspect-video w-full ${className ?? ""}`}>
      <iframe
        className="w-full h-full rounded-xl"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
