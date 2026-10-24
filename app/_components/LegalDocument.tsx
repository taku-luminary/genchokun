import type { LegalDocument as LegalDocumentData, LegalRevision } from "@/app/_types/legal";
import { formatYmdJa } from "@/app/_utils/format";

type Props = {
  document: LegalDocumentData;
};

// 改定の経過の1行。最初の版は「制定」、それ以外は「改定」とし、効力発生日が公開日と違うときだけ効力発生日を添える
function revisionLine(revision: LegalRevision, index: number): string {
  const label = index === 0 ? "制定" : "改定";
  const effective =
    revision.effectiveAt !== revision.publishedAt ? `、${formatYmdJa(revision.effectiveAt)}から効力` : "";
  const summary = revision.summary ? `：${revision.summary}` : "";
  return `第${revision.version}版（${formatYmdJa(revision.publishedAt)} ${label}${effective}）${summary}`;
}

// 法務文書の共通レンダラ。規約・ポリシーで同じ見た目にそろえる。
// dangerouslySetInnerHTML を使わないのは、文書が増えても XSS の経路を作らないため。
export function LegalDocument({ document }: Props) {
  // 改定の経過の最後の行が、今公開している版
  const latest = document.revisions[document.revisions.length - 1];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{document.title}</h1>

      {/* 版数と日付は、どの版に同意したかを後から確認できるようにするため本文と一緒に出す */}
      <p className="mt-2 text-xs text-slate-400">
        第 {latest.version} 版 ／ 最終改定日 {formatYmdJa(latest.publishedAt)}
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

        {/* 制定日・改定日・効力発生日をまとめて示す。利用規約では、第17条の「変更後の内容と効力発生日を効力発生日より前に掲載」の掲載場所になる */}
        <section>
          <h2 className="text-base font-bold text-slate-700 md:text-lg">改定の経過</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 md:text-base">
            {document.revisions.map((revision, index) => (
              <li key={revision.version}>{revisionLine(revision, index)}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
