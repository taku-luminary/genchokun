// 記事のステータス（schema.prisma の article_status enum と対応）
export type ArticleStatus = "draft" | "published" | "archived";

// 公開ページに表示する記事（published のみ返す想定）
// 簡易版なので、ブロックを「セクションごとの本文テキスト」に均してから渡す
export type InterviewArticlePublic = {
  title: string;
  introText: string | null;
  youtubeUrl: string | null;         // 導入文の下に埋め込む YouTube 動画のURL
  companyIntroText: string | null;   // 会社紹介セクションの本文
  workStyleText: string | null;      // 働き方セクションの本文
};

// 管理者の編集画面が「初期表示」で受け取る型（既存記事があれば返す。なければ null）
export type AdminArticleResponse = {
  article: {
    title: string;
    introText: string | null;
    youtubeUrl: string | null;
    companyIntroText: string | null;
    workStyleText: string | null;
    status: ArticleStatus;
  } | null;
};

// 管理者が「保存」するときに送る型（フォームの送信内容）
export type UpsertArticleRequest = {
  title: string;                      // 必須
  introText?: string;
  youtubeUrl?: string;                // 任意（URL貼り付け。空でもOK）
  companyIntroText?: string;
  workStyleText?: string;
  status: "draft" | "published";      // 簡易版では archived は使わない
};
