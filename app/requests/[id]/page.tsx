'use client';

import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { RequestCard } from '@/app/_components/Cards';
import type { RequestDetailResponse } from '@/app/_types/requests';
import type { HomeRequest } from '@/app/_types/home';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAuthedFetch<RequestDetailResponse>(`/api/requests/${id}`);

  if (isLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  if (error || !data) {
    return <p className="text-center text-red-500 py-20">依頼の取得に失敗しました</p>;
  }

  const isCompleted = data.status === "completed";

  const homeRequest: HomeRequest = {
    id: data.id,
    created_at: data.created_at,
    prefecture: data.prefecture,
    city: data.city,
    title: data.title,
    availableStartDate: data.availableStartDate,
    availableEndDate: data.availableEndDate,
    investigationSummary: data.investigationSummary,
    paymentCycle: data.paymentCycle,
    rewardMinYen: data.rewardMinYen,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 依頼カード */}
        <div className="pointer-events-none">
          <RequestCard request={homeRequest} />
        </div>

        {/* 詳細カード・マッチングボタン */}
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-brand-green">
          <div className="p-6 space-y-4">
            <p className="font-bold text-slate-700">調査内容</p>

            {data.investigationSummary ? (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">概要</p>
                <p className="text-slate-700">{data.investigationSummary}</p>
              </div>
            ) : (
              <p className="text-slate-400">概要の記載なし</p>
            )}

            {data.investigationDetails && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">詳細</p>
                <p className="text-slate-700 whitespace-pre-wrap">{data.investigationDetails}</p>
              </div>
            )}
          </div>

          {!isCompleted && (
            <div className="px-6 pb-6">
              <button
                onClick={() => alert("マッチング機能は現在準備中です")}
                className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition"
              >
                この依頼にマッチングを申し込む
              </button>
            </div>
          )}
        </div>

        {/* 依頼者の自社情報 */}
        {data.company && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="pb-2 space-y-1 flex items-center gap-2">
              <p className="text-m font-bold text-slate-700">依頼者の自社情報</p>
              <p className="text-xs text-slate-400">掲載された会社情報です</p>
            </div>

            <CompanyRow label="会社名" value={data.company.name} />
            <CompanyRow
              label="所在地"
              value={[data.company.prefecture, data.company.city, data.company.address]
                .filter(Boolean)
                .join(" ")}
            />
            {data.company.representativeName && (
              <CompanyRow label="代表者" value={data.company.representativeName} />
            )}
            {data.company.employeeCount && (
              <CompanyRow label="従業員数" value={`${data.company.employeeCount}名`} />
            )}
            {data.company.websiteUrl && (
              <div className="flex gap-2">
                <p className="text-sm font-bold text-slate-700 w-24 flex-shrink-0">Webサイト</p>
                <a
                  href={data.company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-green underline break-all"
                >
                  {data.company.websiteUrl}
                </a>
              </div>
            )}
            {data.company.description && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">会社紹介</p>
                <p className="text-slate-700 whitespace-pre-wrap">{data.company.description}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );

function CompanyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <p className="text-sm font-bold text-slate-700 w-24 flex-shrink-0">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}
}