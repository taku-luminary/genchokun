"use client";

import { calcDaysLeft } from "@/app/_utils/format";
import { useState } from "react";
import Link from "next/link"; 
import { ProjectCard, RequestCard } from "@/app/_components/Cards";
import type { MypageApiResponse, AppliedProject } from "@/app/_types/mypage";
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';

export default function MyPage() {
  const { data, error, isLoading } = useAuthedFetch<MypageApiResponse>("/api/mypage");
  const [tab, setTab] = useState<"projects" | "requests">("projects");
  // ▼ 追加: 一覧の表示モード。"posted"=掲載した案件 / "applied"=応募した案件
  //         統計ボックスのクリックで切り替える
  const [mode, setMode] = useState<"posted" | "applied">("posted");
  const stats = data?.stats;
  const projects = data?.projects ?? [];
  const requests = data?.requests ?? [];
  // ▼ 追加: 応募した案件の一覧
  const appliedProjects = data?.appliedProjects ?? [];
  const appliedRequests = data?.appliedRequests ?? [];

  return (
    <>
      {/* ========== 上部：白背景エリア ========== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-6">

        <h1 className="text-2xl md:text-3xl font-black text-center text-slate-800">
            マイページ
          </h1>

          {/* 統計グリッド（3マス） */}
          {isLoading && (
            <p className="text-center text-slate-500">
              データを読み込み中...
            </p>
          )}

          {!isLoading && error && (
            <p className="text-center text-red-500">
              データを取得できませんでした
            </p>
          )}

          {!isLoading && !error && stats && (
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">

              <div
                className={`rounded-2xl p-4 md:p-6 row-span-2 flex flex-col justify-between card-shadow 
                  ${stats.todoCount > 0
                    ? "bg-red-50 border-red-100"
                    : "bg-white border-slate-300"
                }`}
              >
                <div>
                  <p className="font-black text-slate-700">お知らせ</p>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">
                    応募されている案件
                  </p>
                </div>
                <p
                  className={`text-5xl md:text-6xl font-black mt-4 ${
                    stats.todoCount > 0 ? "text-red-400" : "text-slate-800"
                  }`}
                >
                  {stats.todoCount}
                  <span className="text-2xl ml-1">件</span>
                </p>
              </div>

              {/* ▼ 変更: div → button にして、クリックで一覧モードを切り替える。
                  選択中のボックスは枠を緑にして「いまどちらを見ているか」を示す */}
              <button
                type="button"
                onClick={() => setMode("posted")}
                className={`rounded-2xl p-4 md:p-5 border-2 card-shadow text-left transition active:scale-[0.98] ${
                  mode === "posted"
                    ? "bg-brand-green border-brand-green"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <p className={`text-xs md:text-base ${mode === "posted" ? "text-white" : "text-slate-600"}`}>
                あなたが<strong>掲載</strong>した案件
                </p>
                <p className={`text-3xl md:text-4xl font-black mt-2 ${mode === "posted" ? "text-white" : "text-slate-800"}`}>
                  {stats.postedCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </button>


              <button
                type="button"
                onClick={() => setMode("applied")}
                className={`rounded-2xl p-4 md:p-5 border-2 card-shadow text-left transition active:scale-[0.98] ${
                  mode === "applied"
                    ? "bg-brand-green border-brand-green"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <p className={`text-xs md:text-base ${mode === "applied" ? "text-white" : "text-slate-600"}`}>
                  あなたが<strong>応募</strong>した案件
                </p>
                <p className={`text-3xl md:text-4xl font-black mt-2 ${mode === "applied" ? "text-white" : "text-slate-800"}`}>
                  {stats.appliedCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </button>


            </div>
          )}

          {/* ▼ 変更: ーー を両サイドのラインに。掲載/応募を大きめ＆緑で強調 */}
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <span className="flex-1 h-px bg-slate-400" />
            <p className="font-bold text-slate-600 whitespace-nowrap">
              あなたが
              <span className="text-xl text-brand-green mx-0.5">
                {mode === "posted" ? "掲載" : "応募"}
              </span>
              した案件
            </p>
            <span className="flex-1 h-px bg-slate-400" />
          </div>

          <div className="bg-slate-100 p-1.5 md:p-2 rounded-2xl md:rounded-3xl flex max-w-2xl mx-auto shadow-inner">
            <button
              onClick={() => setTab("projects")}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-black transition-all duration-300 ${
                tab === "projects"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/100"
              }`}
            >
              募集中の工事案件
            </button>
            <button
              onClick={() => setTab("requests")}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-black transition-all duration-300 ${
                tab === "requests"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/100"
              }`}
            >
              対応できる工事店枠
            </button>
          </div>
        </div>
      </section>

      {/* ========== 下部：グレー背景エリア ========== */}
      <section className="bg-[#e8e8e8]">
        <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">

          {isLoading && (
              <p className="text-center text-slate-500 py-10">読み込み中...</p>
            )}
           {!isLoading && error && (
              <p className="text-center text-red-500 py-10">
                データの取得に失敗しました
              </p>
            )}

          {/* ▼ 変更: mode === "posted" の条件を追加（掲載した案件モードのみ表示） */}
          {!isLoading && !error && mode === "posted" && tab === "projects" && (
            <div className="space-y-3 md:space-y-5">
              {projects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  掲載した工事案件はありません
                </p>
              ) : (
                projects.map((project) => {
                  const hasMatch = project.matches.some((m) => m.status === "active");
                  // 「生きてる応募」の件数 = pending(未決定) + active(決定済)
                  // rejected/cancelled は数えない
                  const applicationCount = project.matches.filter(
                    (m) => m.status === "pending" || m.status === "active"
                  ).length;
                  // ▼ 追加: 終了判定（カード内タグと同じ: 完了 or 期限切れ）
                  const daysLeft = calcDaysLeft(project.workEndDate);
                  const isFinished =
                    project.status === "completed" ||
                    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

                  return (
                    <Link
                      key={project.id}
                      href={`/mypage/projects/${project.id}`}
                      className="block space-y-1"
                    >
                      <PostedStatusBadge
                        hasMatch={hasMatch}
                        applicationCount={applicationCount}
                        isFinished={isFinished}
                      />
                      <ProjectCard project={project} isMatched={hasMatch} applicationCount={applicationCount} />
                    </Link>

                  );
                })
              )}
            </div>
          )}

          {/* ▼ 変更: mode === "posted" の条件を追加 */}
          {!isLoading && !error && mode === "posted" && tab === "requests" && (
            <div className="space-y-3 md:space-y-5">
              {requests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  掲載した工事店枠はありません
                </p>
              ) : (
                requests.map((request) => {
                  const hasMatch = request.match?.status === "active";
                  // ▼ 追加: 終了判定（完了 or 期限切れ）
                  const daysLeft = calcDaysLeft(request.availableEndDate);
                  const isFinished =
                    request.status === "completed" ||
                    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

                  return (
                    <Link
                      key={request.id}
                      href={`/requests/${request.id}`}
                      className="block space-y-1"
                    >
                      <PostedStatusBadge hasMatch={hasMatch} isFinished={isFinished} />
                      <RequestCard request={request} isMatched={hasMatch} />
                    </Link>

                  );
                })
              )}
            </div>
          )}

          {/* ▼ 追加: 応募した工事案件の一覧。クリックで公開詳細ページへ。
              詳細ページ側が応募状態(応募中/当選/落選)に応じた表示を出し分ける */}
          {!isLoading && !error && mode === "applied" && tab === "projects" && (
            <div className="space-y-3 md:space-y-5">
              {appliedProjects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  応募した工事案件はありません
                </p>
              ) : (
                appliedProjects.map((item) => (
                  <Link
                    key={item.matchId}
                    href={`/projects/${item.project.id}`}
                    className="block space-y-1"
                  >
                    <AppliedStatusBadge status={item.myStatus} />
                    <ProjectCard project={item.project} isMatched={item.myStatus === "active"} />
                  </Link>

                ))
              )}
            </div>
          )}

          {/* ▼ 追加: 応募した依頼（お仕事待ちの工事店）の一覧 */}
          {!isLoading && !error && mode === "applied" && tab === "requests" && (
            <div className="space-y-3 md:space-y-5">
              {appliedRequests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  応募した工事店枠はありません
                </p>
              ) : (
                appliedRequests.map((item) => (
                  <Link
                    key={item.matchId}
                    href={`/requests/${item.request.id}`}
                    className="block space-y-1"
                  >
                    <AppliedStatusBadge status={item.myStatus} />
                    <RequestCard request={item.request} isMatched={item.myStatus === "active"} />
                  </Link>
                ))
              )}
            </div>
          )}

        </div>
      </section>
    </>
  );
}

// ▼ 追加: 応募した案件カードの上に出す自分の応募状態ラベル
function AppliedStatusBadge({ status }: { status: AppliedProject["myStatus"] }) {
  if (status === "active") {
    return <p className="text-sm font-bold text-brand-green">🎉 マッチング成立</p>;
  }
  if (status === "pending") {
    return <p className="text-sm font-bold text-slate-600">応募中・決定待ち</p>;
  }
  // rejected(落選) / cancelled(取下げ)
  return <p className="text-sm font-bold text-slate-600">不成立</p>;
}


// ▼ 追加: 掲載した案件カードの上に出す、掲載者視点のステータスラベル
function PostedStatusBadge({
  hasMatch,
  applicationCount = 0,
  isFinished,
}: {
  hasMatch?: boolean;
  applicationCount?: number;
  isFinished?: boolean;
}) {
  if (hasMatch) {
    return <p className="text-sm font-bold text-brand-green">🎉 マッチング成立</p>;
  }
  if (applicationCount > 0) {
    return <p className="text-sm font-bold text-red-600">応募あり・要対応</p>;
  }
  if (isFinished) {
    return <p className="text-sm font-bold text-slate-500">終了</p>;
  }
  return <p className="text-sm font-bold text-slate-600">募集中</p>;
}

