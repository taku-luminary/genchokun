import type { LegalDocument as LegalDocumentData } from "@/app/_types/legal";
import { formatYmdJa } from "@/app/_utils/format";

type Props = {
  document: LegalDocumentData;
};

// 法務文書の共通レンダラ。規約・ポリシーで同じ見た目にそろえる。
// dangerouslySetInnerHTML を使わないのは、文書が増えても XSS の経路を作らないため。
export function LegalDocument({ document }: Props) {
  // 最後の行が、今公開している版
  const latest = document.revisions[document.revisions.length - 1];
  // 効力発生日が公開日と同じ版は、最終改定日と同じ日になるので出さない
  const showsEffectiveDate = document.showsEffectiveDate === true && latest.effectiveAt !== latest.publishedAt;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{document.title}</h1>

      {/* 版数と日付は、どの版に同意したかを後から確認できるようにするため本文と一緒に出す */}
      <p className="mt-2 text-xs text-slate-400">
        第 {latest.version} 版 ／ 最終改定日 {formatYmdJa(latest.publishedAt)}
      </p>

      {/* 利用規約では、第17条の「変更後の内容と効力発生日を効力発生日より前に掲載」の掲載場所になる。
          最終改定日と取り違えないよう別の行にする。効力発生日だけだと、その前に同意した会員にも効力発生日から適用すると読めるため、同意の時から適用することを添える */}
      {showsEffectiveDate && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          効力発生日 {formatYmdJa(latest.effectiveAt)}（この日より前に第{latest.version}版に同意した会員には、同意の時から適用します）
        </p>
      )}

      <div className="mt-8 space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-bold text-slate-700 md:text-lg">{section.heading}</h2>

            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base"
              >
                {paragraph}
              </p>
            ))}

            {section.items && (
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-slate-600 md:text-base">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
