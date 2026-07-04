import type { InterviewArticlePublic } from "@/app/_types/articles";

export function InterviewArticle({ article }: { article: InterviewArticlePublic }) {
  return (
    <section className="space-y-2">
      {/* 見出し＋注釈：運営による取材記事であることを明示する。
          記事があるときだけ表示されるので、未掲載の企業には何も出ない。 */}
      <div>
        <h2 className="text-lg font-bold text-slate-700">取材記事</h2>
        <p className="text-xs text-slate-400">
          現調くん運営が取材・編集し、掲載している記事です
        </p>
      </div>

      {/* 記事本体カード */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
        {/* タイトル＋導入文 */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{article.title}</h1>
          {article.introText && (
            <p className="text-slate-700 whitespace-pre-wrap mt-2">
              {article.introText}
            </p>
          )}
        </div>

        {/* 会社紹介セクション */}
        {article.companyIntroText && (
          <section className="space-y-2">
            <h4 className="font-bold text-brand-green border-l-4 border-brand-green pl-2">
              会社紹介
            </h4>
            <p className="text-slate-700 whitespace-pre-wrap">
              {article.companyIntroText}
            </p>
          </section>
        )}

        {/* 働き方セクション */}
        {article.workStyleText && (
          <section className="space-y-2">
            <h4 className="font-bold text-brand-green border-l-4 border-brand-green pl-2">
              働き方
            </h4>
            <p className="text-slate-700 whitespace-pre-wrap">
              {article.workStyleText}
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
