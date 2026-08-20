'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import { MatchedContactCard } from '@/app/_components/MatchedContactCard';
import { InvestigationCard } from '@/app/_components/InvestigationCard';
import { CompanyInfoCard } from '@/app/_components/CompanyInfoCard';
import { calcDaysLeft } from '@/app/_utils/format';
import type { ProjectDetailResponse } from '@/app/_types/projects';
import type { HomeProject } from '@/app/_types/home';
import { ReviewPromptCard } from '@/app/_components/ReviewPromptCard';
import { ReviewedCard } from '@/app/_components/ReviewedCard';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, mutate } = useAuthedFetch<ProjectDetailResponse>(`/api/projects/${id}`);

  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data) return <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>;

  // 状態判定
  // - isExpired: workEndDate を過ぎている (期限切れ)
  // - isClosed:  status=completed (販売店が手動で完了 / マッチ確定後など)
  // 注: projects は複数応募可能なので requests のような isMatched 概念は持たない。
  const daysLeft = calcDaysLeft(data.workEndDate);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isClosed = data.status === "completed";

  // ログイン中ユーザーの状態を myMatchStatus から判定する。
  //   null:     未応募
  //   pending:  応募済み、販売店の決定待ち
  //   active:   自分が選ばれた（マッチ成立）
  //   rejected: 他の応募者が選ばれた（落選）
  const isApplied = data.myMatchStatus !== null;
  const isWon = data.myMatchStatus === "active";
  const isLost = data.myMatchStatus === "rejected";
  const isWaiting = data.myMatchStatus === "pending";

  // ProjectDetailResponse → HomeProject に変換してカードに渡す
  const homeProject: HomeProject = {
    id: data.id,
    createdAt: data.createdAt,
    prefecture: data.prefecture,
    city: data.city,
    title: data.title,
    workStartDate: data.workStartDate,
    workEndDate: data.workEndDate,
    rewardType: data.rewardType,
    rewardYen: data.rewardYen,
    paymentCycle: data.paymentCycle,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ▼ 並び替え: ステータス/誘導カードを最上部にまとめる */}

        {/* 掲載者本人向けの案内。枠は付けず、マイページへのテキストリンクにする */}
        {data.isMyProject && (
          <div>
            <p className="text-sm text-slate-600">こちらはあなたが掲載した案件です。</p>
            <Link
              href={`/mypage/projects/${data.id}`}
              className="block text-sm font-bold text-brand-green underline hover:opacity-80 transition"
            >
              マイページで応募状況・連絡先を確認する
            </Link>
          </div>
        )}


        {/* 自分が選ばれた時：状態に応じて ①連絡先 / ②レビュー依頼 / ③投稿済み */}
        {isWon && (
          data.reviewCard?.cardState === 'needsReview' ? (
            <ReviewPromptCard
              matchId={data.reviewCard.matchId}
              targetRole={data.reviewCard.targetRole}
              partnerCompany={data.reviewCard.partnerCompany}
              contactLabel="販売店の連絡先"
              contact={data.salesContact}
              onReviewed={mutate}
            />
          ) : data.reviewCard?.cardState === 'reviewed' && data.reviewCard.myReview ? (
            <ReviewedCard
              reviewId={data.reviewCard.myReview.id}
              targetRole={data.reviewCard.targetRole}
              initialValues={data.reviewCard.myReview}
              partnerCompany={data.reviewCard.partnerCompany}
              onChanged={mutate}
            />
          ) : (
            <MatchedContactCard
              title="🎉 あなたが選ばれました"
              description="下記の連絡先に直接ご連絡し、現地調査の日程調整などを進めてください。"
              contactLabel="販売店の連絡先"
              contact={data.salesContact}
            />
          )
        )}

        {/* 落選通知（地味めに表示） */}
        {isLost && (
          <section className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-6 space-y-1">
            <p className="text-xl font-bold text-slate-700">
              この案件は終了しました
            </p>
            <p className="text-slate-600 font-medium">
              他の応募者とマッチングが成立したため、応募は締め切られました。
            </p>
          </section>
        )}

        {/* ▼ 連続ブロック: 案件カード → 調査内容 → 投稿元情報 */}

        {/* 案件カード（クリック無効） */}
        <div className="pointer-events-none">
          <ProjectCard project={homeProject} />
        </div>

        {/* 調査内容（共通カード）。応募ボタン群は children として差し込む */}
        <InvestigationCard
          summary={data.investigationSummary}
          details={data.investigationDetails}
        >
          {/* 応募可能: 掲載者本人ではない && 未応募 && オープン && 期限内 */}
          {!data.isMyProject && !isApplied && !isClosed && !isExpired && (
            <div className="px-6 pb-6">
              <Link
                href={`/projects/${data.id}/apply`}
                className="block w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition text-center"
              >
                この案件に応募する
              </Link>
            </div>
          )}

          {/* 応募済み・選考中 (pending) */}
          {isWaiting && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                応募済み・販売店の決定をお待ちください
              </button>
            </div>
          )}

          {/* 自分が選ばれた (active) */}
          {isWon && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg cursor-not-allowed"
              >
                マッチング成立済み
              </button>
            </div>
          )}

          {/* 募集が手動終了 (status=completed) かつ未応募 かつ 掲載者本人ではない */}
          {!data.isMyProject && !isApplied && isClosed && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                募集は終了しました
              </button>
            </div>
          )}

          {/* 期限切れ (未応募、手動完了でもない、掲載者本人でもない) */}
          {!data.isMyProject && !isApplied && !isClosed && isExpired && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-base cursor-not-allowed"
              >
                応募は終了しました
              </button>
            </div>
          )}
        </InvestigationCard>

        {/* 投稿元の販売店情報（共通カード） */}
        {data.company && (
          <CompanyInfoCard
            title="投稿元の販売店情報"
            subtitle="販売店が掲載している情報です"
            company={data.company}
          />
        )}
      </div>
    </div>
  );
}
