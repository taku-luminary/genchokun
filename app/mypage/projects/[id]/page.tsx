'use client';
import { MatchedContactCard } from '@/app/_components/MatchedContactCard';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import type { MypageProjectDetailResponse } from '@/app/_types/mypage';
import type {
  DecideProjectMatchRequest,
  DecideProjectMatchResponse,
} from '@/app/_types/applications';

export default function MypageProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  // useAuthedFetch は内部で useSWR を呼んでいるので mutate も受け取れる
  // mutate() を呼ぶとサーバーから再取得して画面が最新になる
  const { data, isLoading, error, mutate } =
    useAuthedFetch<MypageProjectDetailResponse>(`/api/mypage/projects/${id}`);

  // 決定処理中の matchId (二重クリック防止 + ボタン表示の出し分け)
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  // サーバーエラーメッセージ
  const [serverError, setServerError] = useState<string | null>(null);

  // 取得中
  if (isLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  // 取得失敗 (ネットワーク等)
  if (error || !data) {
    return (
      <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>
    );
  }
  // サーバーが error を返したケース (404 等)
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

      // マッチング成立に成功したあと、SWRのmutate()でAPIを再取得する。
      // サーバー側で更新された最新データを画面に反映するため。
      // 例: pending が active になり、画面に「マッチング成立済み」が表示される。
      // mutate() を呼ぶ
      // ↓
      // SWR が同じURLのAPIをもう一度 fetch する
      // ↓
      // 新しい data が SWR 内部の state/cache に入る
      // ↓
      // data が変わる
      // ↓
      // React が再描画する
      // ↓
      // 画面表示が変わる
      await mutate();
    } catch {
      setServerError('通信エラーが発生しました');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* 1. 案件サマリ (マイページ一覧と同じ ProjectCard を流用) */}
        {/* pointer-events-none でカードを非クリック化 (詳細ページなので遷移不要) */}
        <div className="pointer-events-none">
          <ProjectCard
            project={project}
            hasMatch={!!matchedApp}
            applicationCount={applications.length}
          />
        </div>

        {/* 2. マッチング成立済みの相手がいる場合は最上部で強調表示 */}
        {/*    相手（工事店）の連絡先はマッチ済みなので公開してOK。 */}
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

        {/* 3. 未決定の応募一覧 */}
        <section className="space-y-3">
          <h2 className="text-center text-slate-700 font-bold">
            ーー届いている応募ーー
          </h2>

          {pendingApps.length === 0 ? (
            <p className="text-center text-slate-500 py-10">
              {matchedApp
                ? '未対応の応募はありません'
                : 'まだ応募はありません'}
            </p>
          ) : (
            pendingApps.map((app) => {
              // 今mapで表示している応募(app)が、現在送信中の応募かどうかを判定する。
              // submittingId には、ボタンを押してAPI送信中の matchId が入る。
              // app.matchId と一致すれば、この応募のボタンだけ「送信中...」表示にする。
              const isThisSubmitting = submittingId === app.matchId;
              // matchedApp がいる or 案件が completed なら決定ボタンは出さない
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

        {/* 4. 戻るリンク */}
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
