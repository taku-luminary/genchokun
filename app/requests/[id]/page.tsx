'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { RequestCard } from '@/app/_components/Cards';
import { calcDaysLeft } from '@/app/_utils/format';
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

  // 状態判定
  // - isExpired:  availableEndDate を過ぎている
  // - isClosed:   status=completed (手動完了など)
  // - isMatched:  既に誰かとマッチング成立済み (1依頼=1マッチ)
  // - isCompleted: いずれかに該当 → 応募ボタンを出さない
  const daysLeft = calcDaysLeft(data.availableEndDate);
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isClosed = data.status === "completed";
  const isCompleted = isClosed || isExpired || data.isMatched;

  // RequestCard 用にデータを整形
  // - hasMatch は渡さない (横の「マッチング済み」ラベルを表示しないため)
  // - 代わりに status をマッチング済みなら "completed" で上書きして
  //   右上バッジを「終了」灰色にする
  //   (応募API側でDBの requests.status も "completed" に更新済みなので
  //    通常は data.status === "completed" だが、保険として明示的に上書き)
  const homeRequest: HomeRequest = {
    id: data.id,
    createdAt: data.createdAt,
    prefecture: data.prefecture,
    city: data.city,
    title: data.title,
    availableStartDate: data.availableStartDate,
    availableEndDate: data.availableEndDate,
    investigationSummary: data.investigationSummary,
    paymentCycle: data.paymentCycle,
    rewardMinYen: data.rewardMinYen,
    // マッチング成立済みなら表示上は "completed" として扱い、右上バッジを「終了」に
    // (DBも変更1で completed に更新されるが、応募直後の data はまだ古い値の可能性があるため
    //  画面表示としても明示的に上書きしておく)
    status: data.isMatched ? "completed" : data.status,
    companyName: data.company?.name ?? null,
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* 依頼カード — マッチ成立済みなら右上バッジが「終了」灰色に */}
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

          {/* 応募可能: 応募ページへの遷移リンク */}
          {!isCompleted && !data.hasApplied && (
            <div className="px-6 pb-6">
              <Link
                href={`/requests/${data.id}/apply`}
                className="block w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition text-center"
              >
                この工事店へ仕事を依頼する
              </Link>
            </div>
          )}

          {/* 自分がマッチング済み */}
          {data.hasApplied && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                マッチング済みです
              </button>
            </div>
          )}

          {/* 他人がマッチング済み (自分は未応募)
              isClosed/isExpired の条件は外して、「マッチが成立している」
              事実を最優先で見せる。応募API側で status も completed に更新されるため
              この分岐は isClosed=true でも発火する必要がある。 */}
          {!data.hasApplied && data.isMatched && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                マッチングが成立済みです
              </button>
            </div>
          )}

          {/* 募集が手動終了 (status=completed) かつマッチ無し
              isClosed && isExpired の両方が true の場合もここでカバーする */}
          {!data.hasApplied && !data.isMatched && isClosed && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                募集は終了しました
              </button>
            </div>
          )}

          {/* 期限切れ (マッチ無し、手動完了でもない) */}
          {!data.hasApplied && !data.isMatched && !isClosed && isExpired && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                応募は終了しました
              </button>
            </div>
          )}
        </div>

        {/* 依頼者の自社情報 */}
        {data.company && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="pb-2 space-y-1 flex items-center gap-2">
              <p className="text-m font-bold text-slate-700">投稿元の工事店情報</p>
              <p className="text-xs text-slate-400">工事店が掲載している情報です</p>
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
