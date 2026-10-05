import type { LegalDocument as LegalDocumentData } from "@/app/_types/legal";

type Props = {
  document: LegalDocumentData;
};

// 法務文書の共通レンダラ。規約・ポリシーで同じ見た目にそろえる。
// dangerouslySetInnerHTML を使わないのは、文書が増えても XSS の経路を作らないため。
export function LegalDocument({ document }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{document.title}</h1>

      {/* 版数と日付は、どの版に同意したかを後から確認できるようにするため本文と一緒に出す */}
      <p className="mt-2 text-xs text-slate-400">
        第 {document.version} 版 ／ 制定・最終改定日 {document.revisedAt}
      </p>

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
