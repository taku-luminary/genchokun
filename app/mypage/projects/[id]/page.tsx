'use client';
import { MatchedContactCard } from '@/app/_components/MatchedContactCard';
import { InvestigationCard } from '@/app/_components/InvestigationCard';
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
      router.push('/mypage');
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

        {/* 1. マッチング成立済みの相手がいる場合は最上部で強調表示 */}
        {matchedApp && (
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
        )}

        {/* サーバーエラー表示 */}
        {serverError && (
          <p className="text-red-500 text-sm text-center">{serverError}</p>
        )}

        {/* 2. 届いている応募 */}
        <section className="space-y-3">
          <h2 className="text-center text-slate-700 font-bold">
            ーー届いている応募ーー
          </h2>

          {pendingApps.length === 0 ? (
            <p className="text-center text-slate-500 font-bold py-10">
              {matchedApp ? (
                '未対応の応募はありません'
              ) : (
                <> まだ応募はありません。 <br />（応募がある場合はこちらに表示されます） </>
              )}
            </p>
          ) : (
            pendingApps.map((app) => {
              const isThisSubmitting = submittingId === app.matchId;
              const canDecide = !matchedApp && project.status === 'open';

              return (
                <article
                  key={app.matchId}
                  className="bg-white rounded-2xl p-5 space-y-3 border border-slate-100"
                >
                  <p className="text-lg font-bold text-slate-800">
                    {app.contractor.companyName ?? '（会社名未登録）'}
                  </p>
                  {app.contractor.prefecture && (
                    <p className="text-xs text-slate-500">
                      {app.contractor.prefecture}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    応募日時: {new Date(app.appliedAt).toLocaleString('ja-JP')}
                  </p>
                  {app.message && (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
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
                      className="w-full py-3 rounded-2xl bg-brand-green text-white font-black shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isThisSubmitting ? '送信中...' : 'この工事店に決定'}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* ▼ 連続ブロック: 案件カード → 調査内容 → 投稿元情報 */}

        {/* 編集/削除ボタン（自分の案件なので常に表示）。
            応募が来ていると disabled（グレーアウト）になり、下に理由を常時表示する */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={!isEditable}
              className="px-4 py-2 rounded-xl border-2 border-neutral-400 text-neutral-700 text-sm font-bold hover:bg-neutral-100 transition disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isEditable || deleting}
              className="px-4 py-2 rounded-xl border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 transition disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
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
          <ProjectCard
            project={project}
            hasMatch={!!matchedApp}
            applicationCount={applications.length}
          />
        </div>

        {/* 調査内容（共通カード・ボタンなし） */}
        <InvestigationCard
          summary={project.investigationSummary}
          details={project.investigationDetails}
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
