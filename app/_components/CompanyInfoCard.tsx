import Link from "next/link";
import type { CompanyInfo } from "@/app/_types/companies";
import { StarRating } from "@/app/_components/ui/StarRating"; // ← 追加

type Props = {
  // 例: "投稿元の販売店情報" / "投稿元の工事店情報"
  title: string;
  // 例: "販売店が掲載している情報です"
  subtitle: string;
  company: CompanyInfo;
};

export function CompanyInfoCard({ title, subtitle, company }: Props) {
  const rating = company.rating ?? null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
      <div className="pb-2 flex items-center gap-2">
        <p className="text-base font-bold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex gap-2">
        <p className="text-sm font-bold text-slate-700 w-20 md:w-24 flex-shrink-0">会社名</p>
        <Link
          href={`/companies/${company.id}`}
          className="text-brand-green font-bold underline hover:opacity-80 transition break-all"
        >
          {company.name}
        </Link>
      </div>

      {/* 評価行：レビューがあれば★＋詳細リンク、無ければ（0件） */}
      <div className="flex gap-2">
        <p className="text-sm font-bold text-slate-700 w-20 md:w-24 flex-shrink-0">評価</p>
        {rating ? (
          <Link
            href={`/companies/${company.id}/reviews`}
            className="min-w-0 flex-1 space-y-1 hover:opacity-80 transition"
          >
            <StarRating rating={rating.average} count={rating.count} />
            <span className="block text-xs text-brand-green underline">
              評価詳細を見る
            </span>
          </Link>
        ) : (
          <span className="text-sm text-slate-400">（0件）</span>
        )}
      </div>


      <CompanyRow
        label="所在地"
        value={[company.prefecture, company.city, company.address].filter(Boolean).join(" ")}
      />
      {company.representativeName && (
        <CompanyRow label="代表者" value={company.representativeName} />
      )}
      {company.employeeCount && (
        <CompanyRow label="従業員数" value={`${company.employeeCount}名`} />
      )}
      {company.websiteUrl && (
        <div className="flex gap-2">
          <p className="text-sm font-bold text-slate-700 w-20 md:w-24 flex-shrink-0">Webサイト</p>
          <a
            href={company.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green underline break-all"
          >
            {company.websiteUrl}
          </a>
        </div>
      )}
      {company.description && (
        <div>
          <p className="text-sm font-bold text-slate-700 mb-1">会社紹介</p>
          <p className="text-slate-700 whitespace-pre-wrap">{company.description}</p>
        </div>
      )}
    </div>
  );
}

function CompanyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <p className="text-sm font-bold text-slate-700 w-20 md:w-24 flex-shrink-0">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}
