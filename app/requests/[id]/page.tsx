'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { RequestCard } from '@/app/_components/Cards';
import { MatchedContactCard } from '@/app/_components/MatchedContactCard';
import { InvestigationCard } from '@/app/_components/InvestigationCard';
import { CompanyInfoCard } from '@/app/_components/CompanyInfoCard';
import { calcDaysLeft } from '@/app/_utils/format';
import type { RequestDetailResponse } from '@/app/_types/requests';
import type { HomeRequest } from '@/app/_types/home';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
  // - マッチング成立済みなら表示上 "completed" として右上バッジを「終了」灰色にする
  const homeRequest: HomeRequest = {
    id: data.id,
    createdAt: data.createdAt,
    prefectures: data.prefectures,
    city: data.city,
    title: data.title,
    availableStartDate: data.availableStartDate,
    availableEndDate: data.availableEndDate,
    investigationSummary: data.investigationSummary,
    paymentCycle: data.paymentCycle,
    rewardMinYen: data.rewardMinYen,
    status: data.isMatched ? "completed" : data.status,
    companyName: data.company?.name ?? null,
  };

  const handleEdit = () => {
    router.push(`/requests/${data.id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('この依頼を削除します。よろしいですか？')) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDeleteError(json.error ?? '削除に失敗しました');
        return;
      }
      // 削除済みの個別ページに「戻る」で戻れないよう push ではなく replace を使う。
      router.replace('/mypage');    
    } catch {
      setDeleteError('通信エラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ▼ 並び替え: マッチ成立の連絡先カードを最上部にまとめる */}

        {/* 応募者視点 — 自分が応募してマッチ成立済み → 工事店の連絡先 */}
        {data.hasApplied && data.isMatched && (
          <MatchedContactCard
            title="🎉 マッチング成立済み"
            description="下記の連絡先に直接ご連絡し、現地調査の日程調整などを進めてください。"
            contactLabel="工事店の連絡先"
            contact={data.contractorContact}
          />
        )}

        {/* 投稿者視点 — 自分の依頼にマッチが入った → 販売店の連絡先 */}
        {data.isMyRequest && data.isMatched && (
          <MatchedContactCard
            title="🎉 あなたの依頼にマッチが入りました"
            description="下記の連絡先に直接ご連絡し、現地調査の日程調整などを進めてください。"
            contactLabel="販売店の連絡先"
            contact={data.salesContact}
          />
        )}

        {/* ▼ 連続ブロック: 依頼カード → 調査内容 → 投稿元情報 */}

        {/* 編集/削除ボタン（自分の依頼なら常に表示）。
            マッチ済みだと disabled（グレーアウト）になり、下に理由を常時表示する */}
        {data.isMyRequest && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleEdit}
                disabled={!data.isEditable}
                className="px-5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm hover:bg-slate-200 transition disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                編集
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!data.isEditable || deleting}
                className="px-5 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm hover:bg-red-100 transition disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
            {!data.isEditable && (
              <p className="text-slate-500 text-sm">
                {data.isMatched
                  ? 'マッチングが成立しているため編集・削除できません'
                  : '募集が終了しているため編集・削除できません'}
              </p>
            )}
            {deleteError && (
              <p className="text-red-500 text-sm">{deleteError}</p>
            )}
          </div>
        )}


        {/* 依頼カード — マッチ成立済みなら右上バッジが「終了」灰色に */}
        <div className="pointer-events-none">
          <RequestCard request={homeRequest} />
        </div>


        {/* 調査内容（共通カード）。マッチングボタン群は children として差し込む */}
        <InvestigationCard
          summary={data.investigationSummary}
          details={data.investigationDetails}
        >
          {/* 応募可能: 応募ページへの遷移リンク */}
          {!isCompleted && !data.hasApplied && !data.isMyRequest && (
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
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg cursor-not-allowed"
              >
                マッチング済みです
              </button>
            </div>
          )}

          {/* 他人がマッチング済み (自分は未応募) */}
          {!data.hasApplied && !data.isMyRequest && data.isMatched && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                マッチングが成立済みです
              </button>
            </div>
          )}

          {/* 募集が手動終了 (status=completed) かつマッチ無し */}
          {!data.hasApplied && !data.isMyRequest && !data.isMatched && isClosed && (
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
          {!data.hasApplied && !data.isMyRequest && !data.isMatched && !isClosed && isExpired && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                応募は終了しました
              </button>
            </div>
          )}
        </InvestigationCard>

        {/* 投稿元の工事店情報（共通カード） */}
        {data.company && (
          <CompanyInfoCard
            title="投稿元の工事店情報"
            subtitle="工事店が掲載している情報です"
            company={data.company}
          />
        )}
      </div>
    </div>
  );
}
