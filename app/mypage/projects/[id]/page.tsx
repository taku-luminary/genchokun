'use client';
import { MatchedContactCard } from '@/app/_components/MatchedContactCard';
import { ContentCard } from '@/app/_components/ContentCard';
import { CompanyInfoCard } from '@/app/_components/CompanyInfoCard';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import type { MypageProjectDetailResponse } from '@/app/_types/mypage';
import type {
  DecideProjectMatchRequest,
  DecideProjectMatchResponse,
} from '@/app/_types/applications';
import { ReviewPromptCard } from '@/app/_components/ReviewPromptCard';
import { ReviewedCard } from '@/app/_components/ReviewedCard';
import { StarRating } from '@/app/_components/ui/StarRating'; 


export default function MypageProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();
  // 削除処理中フラグ（二重クリック防止＋ボタン表示の出し分け）
  const [deleting, setDeleting] = useState(false);
  // 削除失敗（通信断・409など）のメッセージ
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, error, mutate } =
    useAuthedFetch<MypageProjectDetailResponse>(`/api/mypage/projects/${id}`);

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  if (error || !data) {
    return <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>;
  }
  if ('error' in data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-600">{data.error}</p>
        <Link href="/mypage" className="inline-block text-brand-green underline">
          マイページに戻る
        </Link>
      </div>
    );
  }

  const { project, applications } = data;

  // 成立済みの応募 (1件 or 0件)
  const matchedApp = applications.find((a) => a.status === 'active');
  // 未決定の応募一覧 (status === "pending")
  const pendingApps = applications.filter((a) => a.status === 'pending');

  // 編集可否（このAPIは pending/active の応募だけ返すので、応募ゼロ && open で判定できる）
  const isEditable = project.status === 'open' && applications.length === 0;

  // 「この工事店に決定」ボタンの処理
  const handleDecide = async (
    matchId: string,
    companyName: string | null,
  ) => {
    const label = companyName ?? 'この応募';
    if (!window.confirm(`${label} とマッチング成立にします。よろしいですか？`)) {
      return;
    }

    setSubmittingId(matchId);
    setServerError(null);

    try {
      const body: DecideProjectMatchRequest = { matchId };
      const res = await fetch(`/api/projects/${id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: DecideProjectMatchResponse = await res.json();

      if (!res.ok) {
        setServerError(
          'error' in json ? json.error : 'マッチング成立に失敗しました',
        );
        return;
      }
      await mutate();
    } catch {
      setServerError('通信エラーが発生しました');
    } finally {
      setSubmittingId(null);
    }
  };

  // 「編集」ボタン（disabled のときは発火しないので guard 不要）
  const handleEdit = () => {
    router.push(`/projects/${project.id}/edit`);
  };

  // 「削除」ボタン（論理削除）
  const handleDelete = async () => {
    if (!window.confirm('この案件を削除します。よろしいですか？')) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDeleteError('error' in json ? json.error : '削除に失敗しました');
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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ▼ 並び替え: 応募状況・マッチ状況を最上部に */}

        {/* 1. マッチ成立済み：状態に応じて ①連絡先 / ②レビュー依頼 / ③投稿済み を出し分け */}
        {matchedApp && (
          data.reviewCard?.cardState === 'needsReview' ? (
            <ReviewPromptCard
              matchId={data.reviewCard.matchId}
              targetRole={data.reviewCard.targetRole}
              partnerCompany={data.reviewCard.partnerCompany}
              contactLabel="工事店の連絡先"
              contact={matchedApp.contractor.contact}
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
              title="✓ マッチング成立済み"
              description="こちらの案件については、下記の連絡先からマッチング相手に確認して進めてください。"
              contactLabel="工事店の連絡先"
              contact={matchedApp.contractor.contact}
            >
              <p className="text-lg font-bold text-slate-800">
                {matchedApp.contractor.companyName ?? '（会社名未登録）'}
              </p>
              {matchedApp.message && (
                <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">
                  {matchedApp.message}
                </p>
              )}
            </MatchedContactCard>
          )
        )}


        {/* サーバーエラー表示 */}
        {serverError && (
          <p className="text-red-500 text-sm text-center">{serverError}</p>
        )}

        {/* 2. 届いている応募 */}
        {!matchedApp && (
        <section className="space-y-3">
          {/* ▼ 変更: ーー を両サイドのラインに */}
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <span className="flex-1 h-px bg-slate-400" />
            <h2 className="font-bold text-slate-700 whitespace-nowrap">
              届いている応募
            </h2>
            <span className="flex-1 h-px bg-slate-400" />
          </div>

          {pendingApps.length === 0 ? (
            <p className="text-center text-slate-500 font-bold py-10">
              まだ応募はありません。 <br />（応募がある場合はこちらに表示されます）
            </p>
          ) : (
            pendingApps.map((app) => {
              const isThisSubmitting = submittingId === app.matchId;
              const canDecide = !matchedApp && project.status === 'open';

              return (
                <article
                  key={app.matchId}
                  className="bg-white rounded-2xl p-5 space-y-3 border-2 border-brand-green"
                >

                  {/* 企業名＋評価。応募が目立つよう brand-green・タイトル相当のサイズ */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {app.contractor.companyName ? (
                      app.contractor.companyId ? (
                        <Link
                          href={`/companies/${app.contractor.companyId}`}
                          className="text-xl font-bold text-brand-green underline hover:opacity-80 transition"
                        >
                          {app.contractor.companyName}
                        </Link>
                      ) : (
                        <p className="text-xl font-bold text-brand-green">
                          {app.contractor.companyName}
                        </p>
                      )
                    ) : (
                      <p className="text-xl font-bold text-slate-400">（会社名未登録）</p>
                    )}

                    {/* 評価（他ページと同様）。無ければ（0件） */}
                    {app.contractor.companyRating ? (
                      <StarRating
                        rating={app.contractor.companyRating.average}
                        count={app.contractor.companyRating.count}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">（0件）</span>
                    )}
                  </div>


                  {app.contractor.prefecture && (
                    <p className="text-sm text-slate-500">
                      {app.contractor.prefecture}
                    </p>
                  )}

                  <p className="text-sm font-medium text-slate-400">
                    応募日時: {new Date(app.appliedAt).toLocaleString('ja-JP')}
                  </p>

                  {app.message && (
                    <p className="text-slate-700 font-medium whitespace-pre-wrap">
                      {app.message}
                    </p>
                  )}

                  {canDecide && (
                    <button
                    type="button"
                    onClick={() =>
                      handleDecide(app.matchId, app.contractor.companyName)
                    }
                    disabled={submittingId !== null}
                    className="w-full py-2 rounded-2xl bg-brand-green text-white font-black text-base shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isThisSubmitting ? '送信中...' : 'この工事店に決定'}
                  </button>
                  )}
                </article>

              );
            })
          )}
        </section>
        )}

        {/* ▼ 連続ブロック: 案件カード → 案件内容 → 投稿元情報 */}

        {/* 編集/削除ボタン（自分の案件なので常に表示）。
            応募が来ていると disabled（グレーアウト）になり、下に理由を常時表示する */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={!isEditable}
              className="px-5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm hover:bg-slate-200 transition disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isEditable || deleting}
              className="px-5 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm hover:bg-red-100 transition disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              {deleting ? '削除中...' : '削除'}
            </button>
          </div>
          {!isEditable && (
            <p className="text-slate-500 text-sm">
              {applications.length > 0
                ? '応募が来ているため編集・削除できません'
                : '募集が終了しているため編集・削除できません'}
            </p>
          )}
          {deleteError && (
            <p className="text-red-500 text-sm">{deleteError}</p>
          )}
        </div>

        {/* 案件カード（クリック無効） */}
        <div className="pointer-events-none">
        <ProjectCard project={project}
         isMatched={!!matchedApp}
         applicationCount={applications.length} />
        </div>

        {/* 案件内容（共通カード・ボタンなし） */}
        <ContentCard
          summaryLabel="案件内容"
          summary={project.summary}
          note={project.note}
        />

        {/* 投稿元(自社)情報（共通カード） */}
        {project.company && (
          <CompanyInfoCard
            title="投稿元の販売店情報（自社）"
            subtitle="あなたが掲載している情報です"
            company={project.company}
          />
        )}

        {/* 戻るリンク */}
        <Link
          href="/mypage"
          className="w-full py-4 rounded-2xl bg-slate-300 block text-center text-slate-700"
        >
          マイページに戻る
        </Link>
      </div>
    </div>
  );
}
