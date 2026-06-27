'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { CompanyInfoCard } from '@/app/_components/CompanyInfoCard';
import type { CompanyPublicResponse } from '@/app/_types/companies';

export default function CompanyPublicPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useAuthedFetch<CompanyPublicResponse>(
    `/api/companies/${id}`
  );

  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data) return <p className="text-center text-red-500 py-20">企業情報の取得に失敗しました</p>;

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* 本人が見たときだけ「編集」ボタンを表示（マイページの自社情報編集へ） */}
        {data.isMyCompany && (
          <div className="flex justify-end">
            <Link
              href="/mypage/settings/company"
              className="px-5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm hover:bg-slate-200 transition"
            >
              編集
            </Link>
          </div>
        )}

        {/* 企業情報（既存カードを再利用） */}
        <CompanyInfoCard
          title="企業情報"
          subtitle="この企業が掲載している情報です"
          company={data.company}
        />

        {/* ここに Phase B で「インタビュー記事」を表示する予定 */}
      </div>
    </div>
  );
}
