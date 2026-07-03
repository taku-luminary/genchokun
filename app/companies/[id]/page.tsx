'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { CompanyInfoCard } from '@/app/_components/CompanyInfoCard';
import { InterviewArticle } from '@/app/_components/InterviewArticle';   // ← 追加
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

        {/* 編集ボタン群（本人＝自社情報編集 / 管理者＝記事編集） */}
        {(data.isMyCompany || data.isAdmin) && (
          <div className="flex justify-end gap-2">
            {data.isMyCompany && (
              <Link
                href="/mypage/settings/company"
                className="px-5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm hover:bg-slate-200 transition"
              >
                自社情報を編集
              </Link>
            )}
            {data.isAdmin && (
              <Link
                href={`/admin/companies/${id}/article/edit`}
                className="px-5 py-1.5 rounded-xl bg-brand-green text-white border border-brand-green text-sm hover:opacity-90 transition"
              >
                記事を編集
              </Link>
            )}
          </div>
        )}

        {/* 企業情報（既存カードを再利用） */}
        <CompanyInfoCard
          title="企業情報"
          subtitle="この企業が掲載している情報です"
          company={data.company}
        />

        {/* インタビュー記事（公開中のものがあるときだけ表示） */}
        {data.article && <InterviewArticle article={data.article} />}
      </div>
    </div>
  );
}
