'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import { ContactInfo } from '@/app/_components/ContactInfo';
import { calcDaysLeft } from '@/app/_utils/format';
import type { ProjectDetailResponse } from '@/app/_types/projects';
import type { HomeProject } from '@/app/_types/home';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
    // useParams<{ id: string }>() は、URLの動的パラメータを取得する関数。
    // <{ id: string }> は、「useParams() の結果は、id というプロパティを持ち、その id は string 型です」と TS に教えている部分。
    // useParams() の結果は params のようなオブジェクトで、その中から分割代入 const { id } = ... によって id だけを取り出している。
    // つまり、URLの [id] に入っている値を、string 型の id 変数として使えるようにしている。

  const { data, isLoading, error } = useAuthedFetch<ProjectDetailResponse>(`/api/projects/${id}`);

  if (isLoading) return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  if (error || !data) return <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>;

  // 状態判定
  // - isExpired: workEndDate を過ぎている (期限切れ)
  // - isClosed:  status=completed (販売店が手動で完了 / マッチ確定後など)
  // 注: projects は複数応募可能なので requests のような isMatched 概念は持たない。
  const daysLeft = calcDaysLeft(data.workEndDate);
  const isExpired = daysLeft !== null && daysLeft <= 0;
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
    rewardYen: data.rewardYen,
    paymentCycle: data.paymentCycle,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* 案件カード（クリック無効） */}
        <div className="pointer-events-none">
          <ProjectCard project={homeProject} />
        </div>

        {/* ▼ 追加: 掲載者本人向けの案内。応募状況・連絡先は管理ページに集約しているため、
            ここでは表示せず管理ページへ誘導する */}
        {data.isMyProject && (
          <section className="bg-neutral-50 border-1 border-neutral-100 rounded-2xl p-6 space-y-3">
            <p className="text-sm font-black text-neutral-700">
               これはあなたが掲載した案件です
            </p>
            <p className="text-sm text-neutral-600">
              応募状況・マッチング状況・マッチ相手の連絡先は管理ページで確認できます。
            </p>
            <Link
              href={`/mypage/projects/${data.id}`}
              className="block w-full py-3 rounded-2xl bg-neutral-600 text-white font-black text-center shadow hover:opacity-90 transition"
            >
              管理ページを開く
            </Link>
          </section>
        )}


        {/* ▼ 追加: 自分が選ばれた時の「マッチング成立」セクション（最優先で目立たせる） */}
        {isWon && (
          <section className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 space-y-3">
            <p className="text-sm font-black text-emerald-700">
              🎉 あなたが選ばれました
            </p>
            <p className="text-sm text-slate-700">
              下記の連絡先に直接ご連絡し、現地調査の日程調整などを進めてください。
            </p>
            <div className="border-t border-emerald-200 pt-3 mt-3">
              <p className="text-xs font-bold text-emerald-700 mb-2">
                ━ 販売店の連絡先 ━
              </p>
              <ContactInfo
                phone={data.salesContact?.phone ?? null}
                email={data.salesContact?.email ?? null}
                lineId={data.salesContact?.lineId ?? null}
                note={data.salesContact?.note ?? null}
              />
            </div>
          </section>
        )}

        {/* ▼ 追加: 落選通知（地味めに表示） */}
        {isLost && (
          <section className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-600">
              この案件は他の応募者でマッチング成立しました
            </p>
          </section>
        )}

        {/* 詳細カード・応募ボタン */}
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

          {/* 応募可能: 応募ページへの遷移リンク
              優先順位の末尾 = 掲載者本人ではない かつ 未応募 かつ 案件オープン かつ 期限内 */}
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

          {/* 自分が選ばれた (active) — ボタン領域は静かに「マッチ成立済み」表示 */}
          {isWon && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg cursor-not-allowed"
              >
                マッチング成立済み
              </button>
            </div>
          )}

          {/* 募集が手動終了 (status=completed) かつ未応募 かつ 掲載者本人ではない
              isClosed && isExpired の両方が true の場合もここでカバーする */}
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
                className="w-full py-4 rounded-2xl bg-slate-500 text-white font-black text-lg cursor-not-allowed"
              >
                応募は終了しました
              </button>
            </div>
          )}
        </div>

        {/* 発注者の自社情報 */}
        {data.company && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="pb-2 flex items-center gap-2">
              <p className="text-m font-bold text-slate-700">投稿元の販売店情報</p>
              <p className="text-xs text-slate-400">販売店が掲載している情報です</p>
            </div>

            <CompanyRow label="会社名" value={data.company.name} />

            <CompanyRow
              label="所在地"
              value={[data.company.prefecture, data.company.city, data.company.address].filter(Boolean).join(" ")}
            />
            
            {data.company.representativeName && <CompanyRow label="代表者" value={data.company.representativeName} />}

            {data.company.employeeCount && <CompanyRow label="従業員数" value={`${data.company.employeeCount}名`} />}

            {data.company.websiteUrl && (
              <div className="flex gap-2">
                <p className="text-sm font-bold text-slate-700 w-24 flex-shrink-0">Webサイト</p>
                <a href={data.company.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-green underline break-all">
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
