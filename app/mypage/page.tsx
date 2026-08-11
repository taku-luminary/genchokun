"use client";

import { calcDaysLeft } from "@/app/_utils/format";
import { useState, useRef } from "react";
import Link from "next/link";
import { ProjectCard, RequestCard } from "@/app/_components/Cards";
import type {
  MypageApiResponse,
  MypageProject,
  MypageRequest,
  AppliedProject,
  AppliedRequest,
} from "@/app/_types/mypage";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";

// お知らせのどれで絞り込むか。null は通常表示
type FocusKind = null | "review" | "application" | "newMatch";

export default function MyPage() {
  const { data, error, isLoading } = useAuthedFetch<MypageApiResponse>("/api/mypage");
  const [tab, setTab] = useState<"projects" | "requests">("projects");
  // 一覧の表示モード。"posted"=掲載した案件 / "applied"=応募した案件
  const [mode, setMode] = useState<"posted" | "applied">("posted");
  // お知らせクリックで有効になる絞り込み。null=通常表示
  const [focusKind, setFocusKind] = useState<FocusKind>(null);
  // お知らせクリック時にスクロールする先（一覧セクション）
  const listSectionRef = useRef<HTMLDivElement>(null);

  const stats = data?.stats;
  const projects = data?.projects ?? [];
  const requests = data?.requests ?? [];
  const appliedProjects = data?.appliedProjects ?? [];
  const appliedRequests = data?.appliedRequests ?? [];

  // カードを開いたら既読にする（fire-and-forget）。
  // 戻ってくると SWR が再取得して newMatch が消える。
  const markSeen = (matchId: string) => {
    fetch(`/api/matches/${matchId}/seen`, { method: "POST" }).catch(() => {});
  };

  // お知らせの各行クリック → その絞り込みにして一覧へスクロール
  const openFocus = (kind: Exclude<FocusKind, null>) => {
    setFocusKind(kind);
    requestAnimationFrame(() => {
      listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // ── focus 用の絞り込み ──
  // review/newMatch は4象限すべてから、application(応募あり) は掲載projectのみ
  const fProjects =
    focusKind === "review"
      ? projects.filter((p) => p.reviewPending)
      : focusKind === "newMatch"
        ? projects.filter((p) => p.newMatch)
        : focusKind === "application"
          ? projects.filter(
              (p) =>
                p.matches.some((m) => m.status === "pending") &&
                !p.matches.some((m) => m.status === "active"),
            )
          : [];
  const fRequests =
    focusKind === "review"
      ? requests.filter((r) => r.reviewPending)
      : focusKind === "newMatch"
        ? requests.filter((r) => r.newMatch)
        : [];
  const fAppliedProjects =
    focusKind === "review"
      ? appliedProjects.filter((a) => a.reviewPending)
      : focusKind === "newMatch"
        ? appliedProjects.filter((a) => a.newMatch)
        : [];
  const fAppliedRequests =
    focusKind === "review"
      ? appliedRequests.filter((a) => a.reviewPending)
      : focusKind === "newMatch"
        ? appliedRequests.filter((a) => a.newMatch)
        : [];
  const focusTotal =
    fProjects.length + fRequests.length + fAppliedProjects.length + fAppliedRequests.length;
  const focusTitle =
    focusKind === "review"
      ? "✍️ レビュー待ちの案件"
      : focusKind === "newMatch"
        ? "🎉 新しくマッチングされた案件"
        : "📩 応募がされている案件";

  return (
    <>
      {/* ========== 上部：白背景エリア ========== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-6">
          <h1 className="text-2xl md:text-3xl font-black text-center text-slate-800">
            マイページ
          </h1>

          {isLoading && (
            <p className="text-center text-slate-500">データを読み込み中...</p>
          )}
          {!isLoading && error && (
            <p className="text-center text-red-500">データを取得できませんでした</p>
          )}

          {!isLoading && !error && stats && (
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {/* お知らせタイル（3指標）。いずれか>0で赤背景。外枠なし・3項目は縦中央 */}
              <div
                className={`rounded-2xl p-4 md:p-6 row-span-2 card-shadow flex flex-col ${
                  stats.reviewPendingCount > 0 || stats.todoCount > 0 || stats.newMatchCount > 0
                    ? "bg-red-50"
                    : "bg-white"
                }`}
              >
                <p className="font-black text-slate-700 text-base md:text-lg">お知らせ</p>
                <div className="flex-1 flex flex-col justify-center space-y-1">
                  <NoticeRow
                    label="レビュー待ち"
                    count={stats.reviewPendingCount}
                    onClick={() => openFocus("review")}
                  />
                  <NoticeRow
                    label="応募あり"
                    count={stats.todoCount}
                    onClick={() => openFocus("application")}
                  />
                  <NoticeRow
                    label="新着マッチング"
                    count={stats.newMatchCount}
                    onClick={() => openFocus("newMatch")}
                  />
                </div>
              </div>

              {/* 掲載した案件モード */}
              <button
                type="button"
                onClick={() => { setMode("posted"); setFocusKind(null); }}
                className={`rounded-2xl p-4 md:p-5 border-2 card-shadow text-left transition active:scale-[0.98] ${
                  mode === "posted" && focusKind === null
                    ? "bg-brand-green border-brand-green"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <p className={`text-xs md:text-base ${mode === "posted" && focusKind === null ? "text-white" : "text-slate-600"}`}>
                  あなたが<strong>掲載</strong>した案件
                </p>
                <p className={`text-3xl md:text-4xl font-black mt-2 ${mode === "posted" && focusKind === null ? "text-white" : "text-slate-800"}`}>
                  {stats.postedCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </button>

              {/* 応募した案件モード */}
              <button
                type="button"
                onClick={() => { setMode("applied"); setFocusKind(null); }}
                className={`rounded-2xl p-4 md:p-5 border-2 card-shadow text-left transition active:scale-[0.98] ${
                  mode === "applied" && focusKind === null
                    ? "bg-brand-green border-brand-green"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <p className={`text-xs md:text-base ${mode === "applied" && focusKind === null ? "text-white" : "text-slate-600"}`}>
                  あなたが<strong>応募</strong>した案件
                </p>
                <p className={`text-3xl md:text-4xl font-black mt-2 ${mode === "applied" && focusKind === null ? "text-white" : "text-slate-800"}`}>
                  {stats.appliedCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </button>
            </div>
          )}

          {/* フォーカス中は見出し＋タブを隠す */}
          {focusKind === null && (
            <>
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
            </>
          )}
        </div>
      </section>

      {/* ========== 下部：グレー背景エリア ========== */}
      <section className="bg-[#e8e8e8]">
        <div ref={listSectionRef} className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">
          {isLoading && (
            <p className="text-center text-slate-500 py-10">読み込み中...</p>
          )}
          {!isLoading && error && (
            <p className="text-center text-red-500 py-10">データの取得に失敗しました</p>
          )}

          {/* フォーカス表示（3指標のいずれかで絞り込み） */}
          {!isLoading && !error && focusKind !== null && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-800">
                  {focusTitle}（{focusTotal}件）
                </p>
                <button
                  type="button"
                  onClick={() => setFocusKind(null)}
                  className="rounded-full border border-slate-400 px-4 py-2 text-sm font-bold text-slate-600 bg-white hover:bg-slate-100"
                >
                  解除
                </button>
              </div>

              {focusTotal === 0 ? (
                <p className="text-center text-slate-500 py-10">該当する案件はありません</p>
              ) : (
                <div className="space-y-3 md:space-y-5">
                  {fProjects.map((project) => (
                    <PostedProjectItem key={`pp-${project.id}`} project={project} onSeen={markSeen} />
                  ))}
                  {fRequests.map((request) => (
                    <PostedRequestItem key={`pr-${request.id}`} request={request} onSeen={markSeen} />
                  ))}
                  {fAppliedProjects.map((item) => (
                    <AppliedProjectItem key={`ap-${item.matchId}`} item={item} onSeen={markSeen} />
                  ))}
                  {fAppliedRequests.map((item) => (
                    <AppliedRequestItem key={`ar-${item.matchId}`} item={item} onSeen={markSeen} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 通常表示：掲載×工事案件 */}
          {!isLoading && !error && focusKind === null && mode === "posted" && tab === "projects" && (
            <div className="space-y-3 md:space-y-5">
              {projects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">掲載した工事案件はありません</p>
              ) : (
                projects.map((project) => (
                  <PostedProjectItem key={project.id} project={project} onSeen={markSeen} />
                ))
              )}
            </div>
          )}

          {/* 通常表示：掲載×工事店枠 */}
          {!isLoading && !error && focusKind === null && mode === "posted" && tab === "requests" && (
            <div className="space-y-3 md:space-y-5">
              {requests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">掲載した工事店枠はありません</p>
              ) : (
                requests.map((request) => (
                  <PostedRequestItem key={request.id} request={request} onSeen={markSeen} />
                ))
              )}
            </div>
          )}

          {/* 通常表示：応募×工事案件 */}
          {!isLoading && !error && focusKind === null && mode === "applied" && tab === "projects" && (
            <div className="space-y-3 md:space-y-5">
              {appliedProjects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">応募した工事案件はありません</p>
              ) : (
                appliedProjects.map((item) => (
                  <AppliedProjectItem key={item.matchId} item={item} onSeen={markSeen} />
                ))
              )}
            </div>
          )}

          {/* 通常表示：応募×工事店枠 */}
          {!isLoading && !error && focusKind === null && mode === "applied" && tab === "requests" && (
            <div className="space-y-3 md:space-y-5">
              {appliedRequests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">応募した工事店枠はありません</p>
              ) : (
                appliedRequests.map((item) => (
                  <AppliedRequestItem key={item.matchId} item={item} onSeen={markSeen} />
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ── お知らせの1行。左の › は固定幅 w-3 で場所を常に確保し、対象のときだけ › を描画。
//    （invisible/transparent などCSSでの非表示に依存しないので確実にズレない）
//    件数>0はクリックで絞り込み（＋赤太字）、0件は表示のみ ──
function NoticeRow({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick: () => void;
}) {
  const active = count > 0;
  const textClass = active ? "text-red-400 font-bold" : "text-slate-600";
  const row = (
    <span className="flex items-baseline gap-1.5 w-full">
      {/* 左の › の場所を固定幅で確保。対象のときだけ › を描画（非対象は空文字＝そもそも出さない） */}
      <span
        aria-hidden="true"
        className="shrink-0 w-3 text-center text-sm md:text-lg font-bold text-red-400"
      >
        {active ? "›" : ""}
      </span>
      <span className={`flex-1 min-w-0 text-sm md:text-lg ${textClass}`}>{label}</span>
      <span className={`shrink-0 text-base md:text-xl font-black ${textClass}`}>
        {count}
        <span className="text-xs ml-0.5">件</span>
      </span>
    </span>
  );
  if (!active) {
    return <div className="py-2">{row}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-2 rounded-lg text-left transition hover:bg-red-100 active:scale-[0.99]"
    >
      {row}
    </button>
  );
}


// ── カードの状態（バッジ文言＋色）を1か所で決める（要対応=赤／成立=緑／その他=スレート）──
type CardTone = "red" | "green" | "slate";
type CardStatusResult = { label: string; tone: CardTone };

function resolveCardStatus(p: {
  reviewPending?: boolean;
  newMatch?: boolean;
  isActive: boolean;                 // active なマッチがある（既読済みの成立）
  hasPendingApplications?: boolean;  // 掲載project専用: 未決定の応募がある
  isFinished?: boolean;
  appliedPending?: boolean;          // 応募側: 自分の応募が決定待ち
  appliedClosed?: boolean;           // 応募側: 落選/取下げ
}): CardStatusResult {
  if (p.reviewPending) return { label: "（要対応）レビュー待ち", tone: "red" };
  if (p.newMatch) return { label: "（要対応）マッチング成立", tone: "red" };
  if (p.isActive) return { label: "🎉 マッチング成立", tone: "green" };
  if (p.hasPendingApplications) return { label: "（要対応）応募あり", tone: "red" };
  if (p.appliedPending) return { label: "応募中・決定待ち", tone: "slate" };
  if (p.appliedClosed) return { label: "不成立", tone: "slate" };
  if (p.isFinished) return { label: "終了", tone: "slate" };
  return { label: "募集中", tone: "slate" };
}

function statusTextClass(tone: CardTone): string {
  if (tone === "red") return "text-red-600";
  if (tone === "green") return "text-brand-green";
  return "text-slate-600";
}

function StatusBadge({ status }: { status: CardStatusResult }) {
  return <p className={`text-sm font-bold ${statusTextClass(status.tone)}`}>{status.label}</p>;
}

// ── 各カード（バッジ＋リンク＋カード＋既読マーク）を型ごとにまとめる ──

function PostedProjectItem({
  project,
  onSeen,
}: {
  project: MypageProject;
  onSeen: (matchId: string) => void;
}) {
  const hasActiveMatch = project.matches.some((m) => m.status === "active");
  const hasPendingApplications = project.matches.some((m) => m.status === "pending");
  const applicationCount = project.matches.filter(
    (m) => m.status === "pending" || m.status === "active",
  ).length;
  const daysLeft = calcDaysLeft(project.workEndDate);
  const isFinished =
    project.status === "completed" ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft < 0);
  const status = resolveCardStatus({
    reviewPending: project.reviewPending,
    newMatch: project.newMatch,
    isActive: hasActiveMatch,
    hasPendingApplications,
    isFinished,
  });
  return (
    <Link
      href={`/mypage/projects/${project.id}`}
      className="block space-y-1"
      onClick={() => {
        if (project.activeMatchId) onSeen(project.activeMatchId);
      }}
    >
      <StatusBadge status={status} />
      <ProjectCard
        project={project}
        isMatched={hasActiveMatch}
        applicationCount={applicationCount}
        attention={status.tone === "red"}
      />
    </Link>
  );
}

function PostedRequestItem({
  request,
  onSeen,
}: {
  request: MypageRequest;
  onSeen: (matchId: string) => void;
}) {
  const hasActiveMatch = request.match?.status === "active";
  const daysLeft = calcDaysLeft(request.availableEndDate);
  const isFinished =
    request.status === "completed" ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft < 0);
  const status = resolveCardStatus({
    reviewPending: request.reviewPending,
    newMatch: request.newMatch,
    isActive: hasActiveMatch,
    isFinished,
  });
  return (
    <Link
      href={`/requests/${request.id}`}
      className="block space-y-1"
      onClick={() => {
        if (request.activeMatchId) onSeen(request.activeMatchId);
      }}
    >
      <StatusBadge status={status} />
      <RequestCard request={request} isMatched={hasActiveMatch} attention={status.tone === "red"} />
    </Link>
  );
}

function AppliedProjectItem({
  item,
  onSeen,
}: {
  item: AppliedProject;
  onSeen: (matchId: string) => void;
}) {
  const isActive = item.myStatus === "active";
  const status = resolveCardStatus({
    reviewPending: item.reviewPending,
    newMatch: item.newMatch,
    isActive,
    appliedPending: item.myStatus === "pending",
    appliedClosed: item.myStatus === "rejected" || item.myStatus === "cancelled",
  });
  return (
    <Link
      href={`/projects/${item.project.id}`}
      className="block space-y-1"
      onClick={() => {
        if (isActive) onSeen(item.matchId);
      }}
    >
      <StatusBadge status={status} />
      <ProjectCard project={item.project} isMatched={isActive} attention={status.tone === "red"} />
    </Link>
  );
}

function AppliedRequestItem({
  item,
  onSeen,
}: {
  item: AppliedRequest;
  onSeen: (matchId: string) => void;
}) {
  const isActive = item.myStatus === "active";
  const status = resolveCardStatus({
    reviewPending: item.reviewPending,
    newMatch: item.newMatch,
    isActive,
    appliedPending: item.myStatus === "pending",
    appliedClosed: item.myStatus === "rejected" || item.myStatus === "cancelled",
  });
  return (
    <Link
      href={`/requests/${item.request.id}`}
      className="block space-y-1"
      onClick={() => {
        if (isActive) onSeen(item.matchId);
      }}
    >
      <StatusBadge status={status} />
      <RequestCard request={item.request} isMatched={isActive} attention={status.tone === "red"} />
    </Link>
  );
}
