'use client';

import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import type { ProjectDetailResponse } from '@/app/_types/projects';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function formatJpDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

function calcDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAuthedFetch<ProjectDetailResponse>(`/api/projects/${id}`);

  if (isLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  if (error || !data) {
    return <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>;
  }

  const isCompleted = data.status === "completed";

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 案件カード */}
        <div className="pointer-events-none">
          <ProjectCard
            date={formatDate(data.created_at)}
            location={`${data.prefecture.name}${data.city ? ` ${data.city}` : ""}`}
            title={data.title}
            schedule={
              data.workStartDate && data.workEndDate
                ? `${formatJpDate(data.workStartDate)}〜${formatJpDate(data.workEndDate)}`
                : "日程未定"
            }
            amount={data.rewardYen ? `${data.rewardYen.toLocaleString()}円` : "—"}
            client={data.company?.name ?? undefined}
            status={isCompleted ? "completed" : "recruiting"}
            daysLeft={calcDaysLeft(data.workEndDate)}
          />
        </div>

        {/* ② 詳細カード・応募ボタン */}
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
                onClick={() => alert("応募機能は現在準備中です")}
                className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition"
              >
                この案件に応募する
              </button>
            </div>
          )}
        </div>

        {/* ③ 発注者の自社情報 */}
        {data.company && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="pb-2 space-y-1 flex items-center gap-2">
              <p className="text-m font-bold text-slate-700">発注者の自社情報</p>
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

        {/* ④ 管理者記事 ← MVPでは実装しない */}

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
