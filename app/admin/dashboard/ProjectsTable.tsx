"use client";

// 管理画面の「案件一覧」テーブル。
// 管理者のPC運用前提のため、既存の概況画面と同じく md: を使わず 1180px 固定幅で書く。
// 見た目（文字サイズ・罫線・バッジ・ピル）は同ファイル群のユーザー一覧テーブルに合わせている。

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import { Modal } from "@/app/_components/ui/Modal";
import type {
  AdminProjectsResponse,
  AdminProjectRow,
  AdminProjectApplicant,
  AdminProjectFollowUp,
  AdminProjectState,
} from "@/app/admin/_type/adminProjects";

type SortKey = "created" | "followUp" | "sales";

// モーダルは1つを使い回し、何を出すかをこの状態で切り替える
type ModalState =
  | { kind: "applicant"; row: AdminProjectRow; applicant: AdminProjectApplicant }
  | { kind: "sales"; row: AdminProjectRow }
  | null;

const SORT_LABELS: [SortKey, string][] = [
  ["created", "掲載順"],
  ["followUp", "要対応順"],
  ["sales", "掲載者順"],
];

// 一般ページのカードと同じ基準（app/_components/Cards.tsx の isCompleted）。
// マッチ成立・期限切れ・削除済みは「終了」として扱い、案件名をグレーにする。
const isClosedState = (state: AdminProjectState) =>
  state === "matched" || state === "expiredClosed" || state === "deleted";

// 状態の表示。列幅を詰めるため、長い「終了（不成立）」だけ意図的に2行に折る。
// 応募が来ているかは「応募」列で分かるので、募集中はまとめて「募集中」と出す。
const STATE_VIEW: Record<
  AdminProjectState,
  { lines: string[]; className: string }
> = {
  open: { lines: ["募集中"], className: "text-slate-700" },
  hasApplicants: { lines: ["募集中"], className: "text-slate-700" },
  matched: { lines: ["マッチ成立"], className: "text-[#12795a]" },
  expiredClosed: { lines: ["終了", "（不成立）"], className: "text-red-600" },
  deleted: { lines: ["削除済み"], className: "text-slate-400" },
};

// 応募者の状態バッジ。既存の未認証バッジと同じ形（枠線なし・薄い背景＋文字色）
const APPLICANT_BADGE: Record<
  AdminProjectApplicant["status"],
  { label: string; className: string }
> = {
  active: { label: "決定", className: "bg-slate-500/10 text-slate-600" },
  rejected: { label: "落選", className: "bg-red-500/10 text-red-600" },
  pending: { label: "保留", className: "bg-amber-500/10 text-amber-700" },
  cancelled: { label: "取消", className: "bg-slate-500/10 text-slate-400" },
};

// 赤＝放っておくと不成立が確定する／すでに不成立になった、だけに付く（判定は route.ts 側）
const TONE_CLASS: Record<AdminProjectFollowUp["tone"], string> = {
  red: "text-red-600",
  amber: "text-amber-700",
  green: "text-[#12795a]", // 本日掲載。すぐに周知する
  slateStrong: "text-slate-700", // やることはあるが急がない（周知）
  slate: "text-slate-500", // 対応不要
};

// "2026-05-17" → "26/05/17"
const toShortDate = (ymd: string) => ymd.slice(2).replace(/-/g, "/");

// "2026-06-01" → "06/01"
const toMonthDay = (ymd: string) => ymd.slice(5).replace("-", "/");

// 応募日時(ISO)を日本時間の "MM/DD" にする。
// ISO文字列を切り出すと UTC 基準になり、深夜の応募が前日表示になるため Intl で変換する。
const toJstMonthDay = (iso: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

// 訪問状況の根拠をツールチップに出すための "MM/DD HH:mm"
const toJstDateTime = (iso: string | null) =>
  iso === null
    ? "記録なし"
    : new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));

// 残り日数は「少ない方が急ぐ」。終了日未設定(null)は最後に回す
const byDeadline = (a: AdminProjectRow, b: AdminProjectRow) =>
  (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999);

// 要対応順で上に出す色の順番。急ぎ(赤)を最優先にし、次に今日しかできない周知(緑)を置く。
// 優先度(priority)より色を先に見るのは、優先度1のグレー（＝通常フローで動かなくてよい案件）が
// 優先度5の赤（＝期限が迫っていて今日動くべき案件）より上に来てしまうのを防ぐため。
const TONE_ORDER: Record<AdminProjectFollowUp["tone"], number> = {
  red: 0,
  green: 1,
  amber: 2,
  slateStrong: 3,
  slate: 4,
};

const SORTERS: Record<
  SortKey,
  (a: AdminProjectRow, b: AdminProjectRow) => number
> = {
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  // 色（急ぎ順）→ 優先度 → 作業完了日が近い順（取り返しがつくうちに手を打てる順）
  followUp: (a, b) =>
    TONE_ORDER[a.followUp.tone] - TONE_ORDER[b.followUp.tone] ||
    a.followUp.priority - b.followUp.priority ||
    byDeadline(a, b) ||
    b.createdAt.localeCompare(a.createdAt),
  sales: (a, b) =>
    (a.salesUser.companyName ?? "").localeCompare(
      b.salesUser.companyName ?? "",
      "ja",
    ) || b.createdAt.localeCompare(a.createdAt),
};

export function ProjectsTable() {
  // このコンポーネントがマウントされた時に初めて取得が走る（タブを開くまで通信しない）
  const { data, error, isLoading } =
    useAuthedFetch<AdminProjectsResponse>("/api/admin/projects");

  const [sort, setSort] = useState<SortKey>("created");
  const [salesFilter, setSalesFilter] = useState("");
  // 状態の絞り込み。3つとも外した状態が既定で、「削除済み以外のすべて」を出す。
  // 終了案件を既定で出すのは、落選フォローや「決めずに期限切れ」を取りこぼさないため。
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyExpired, setOnlyExpired] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  // 掲載者メニューの外側をクリックしたら閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  if (isLoading) return <p className="p-8 text-slate-500">読み込み中…</p>;
  if (error)
    return <p className="p-8 text-slate-500">データの取得に失敗しました</p>;
  if (!data) return null;

  const visible = data.projects.filter((p) => {
    if (salesFilter !== "" && p.salesUser.companyName !== salesFilter)
      return false;
    // 削除済みは独立したトグル。ONのときだけ表示対象に加える
    if (p.state === "deleted") return showDeleted;
    // 「〜のみ表示」で絞り込む。どちらも外していれば削除済み以外すべて出す
    if (!onlyOpen && !onlyExpired) return true;
    if (onlyOpen && (p.state === "open" || p.state === "hasApplicants"))
      return true;
    if (onlyExpired && p.state === "expiredClosed") return true;
    return false;
  });
  const rows = [...visible].sort(SORTERS[sort]);

  // その日の作業量が先に分かるように、絞り込み後の件数を数える
  const greenCount = rows.filter((p) => p.followUp.tone === "green").length;
  const redCount = rows.filter((p) => p.followUp.tone === "red").length;
  const amberCount = rows.filter((p) => p.followUp.tone === "amber").length;

  const salesNames = [
    ...new Set(
      data.projects
        .map((p) => p.salesUser.companyName)
        .filter((name): name is string => name !== null),
    ),
  ].sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <>
      {/* min-h は、掲載者で絞り込んで0〜1件になっても枠がつぶれないようにするため */}
      <div className="max-h-[calc(100vh-72px)] min-h-[340px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <span className="mr-1 text-xs text-slate-500">並び替え</span>
          {SORT_LABELS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (sort === key
                  ? "border-[#34b38a] bg-[#34b38a]/10 font-bold text-[#12795a]"
                  : "border-slate-200 text-slate-600")
              }
            >
              {label}
            </button>
          ))}
          <label className="ml-2 flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="accent-[#34b38a]"
            />
            募集中のみ表示
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyExpired}
              onChange={(e) => setOnlyExpired(e.target.checked)}
              className="accent-[#34b38a]"
            />
            終了（不成立）のみ表示
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="accent-[#34b38a]"
            />
            削除済表示
          </label>
          <span className="ml-auto flex items-center gap-2 text-xs">
            {greenCount > 0 && (
              <span className="rounded bg-[#34b38a]/15 px-1.5 py-0.5 font-bold text-[#12795a]">
                本日掲載 {greenCount}件
              </span>
            )}
            {redCount > 0 && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-bold text-red-600">
                急ぎ {redCount}件
              </span>
            )}
            {amberCount > 0 && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-bold text-amber-700">
                要連絡 {amberCount}件
              </span>
            )}
            <span className="text-slate-500">{rows.length}件を表示</span>
          </span>
        </div>

        <table className="w-full table-fixed border-collapse text-sm">
          {/* 案件名/掲載者 300・掲載日 72・作業期間 104・状態 88・応募 52・応募者 356・訪問状況 80・要対応 288 ＝ 1340。
              使える幅（1440pxの画面で約1375px）より少なめにしてある。ぴったり合わせると
              縦スクロールバーの幅だけで横スクロールが出るため。 */}
          <colgroup>
            <col className="w-[300px]" />
            <col className="w-[72px]" />
            <col className="w-[104px]" />
            <col className="w-[88px]" />
            <col className="w-[52px]" />
            <col className="w-[356px]" />
            <col className="w-[80px]" />
            <col className="w-[288px]" />
          </colgroup>
          <thead>
            <tr className="[&_th]:sticky [&_th]:top-[41px] [&_th]:z-10 [&_th]:border-b [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:text-slate-600">
              <th className="relative !z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    // この click で外側クリックの監視が反応しないように止める
                    e.stopPropagation();
                    setMenuOpen((open) => !open);
                  }}
                  className="flex items-center gap-1"
                >
                  <span className={salesFilter === "" ? "" : "text-[#12795a]"}>
                    {salesFilter === ""
                      ? "案件名 / 掲載者"
                      : `掲載者: ${salesFilter}`}
                  </span>
                  <span className="text-[9px]">▼</span>
                </button>
                {menuOpen && (
                  <div className="absolute left-2 top-7 z-30 max-h-60 w-56 overflow-auto rounded-lg border border-slate-300 bg-white py-1 shadow-lg">
                    {["", ...salesNames].map((name) => (
                      <button
                        key={name === "" ? "__all__" : name}
                        type="button"
                        onClick={() => setSalesFilter(name)}
                        className={
                          "block w-full px-3 py-2 text-left text-[11px] hover:bg-slate-50 " +
                          (salesFilter === name
                            ? "font-bold text-[#12795a]"
                            : "text-slate-600")
                        }
                      >
                        {salesFilter === name ? "✓ " : "　"}
                        {name === "" ? "すべての掲載者" : name}
                      </button>
                    ))}
                  </div>
                )}
              </th>
              <th>掲載日</th>
              <th>作業期間</th>
              <th>状態</th>
              <th className="!text-right">応募</th>
              <th>応募者（申込順）</th>
              <th>訪問状況</th>
              <th>（開発中）要対応</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-xs text-slate-500"
                >
                  該当する案件がありません。
                  <br />
                  終了案件や削除済みを隠している場合は、上のチェックを見直してください。
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <ProjectRow
                  key={p.projectId}
                  project={p}
                  onOpenSales={() => setModal({ kind: "sales", row: p })}
                  onOpenApplicant={(applicant) =>
                    setModal({ kind: "applicant", row: p, applicant })
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Legend />

      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === null
            ? ""
            : modal.kind === "applicant"
              ? `${modal.applicant.companyName ?? "（会社未登録）"}（応募者）`
              : `${modal.row.salesUser.companyName ?? "（会社未登録）"}（掲載者）`
        }
      >
        {modal?.kind === "applicant" && (
          <ApplicantModalBody applicant={modal.applicant} />
        )}
        {modal?.kind === "sales" && (
          <SalesModalBody
            project={modal.row}
            onFilter={() => {
              setSalesFilter(modal.row.salesUser.companyName ?? "");
              setModal(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

/* ---- 1行 ---- */
function ProjectRow({
  project: p,
  onOpenSales,
  onOpenApplicant,
}: {
  project: AdminProjectRow;
  onOpenSales: () => void;
  onOpenApplicant: (applicant: AdminProjectApplicant) => void;
}) {
  const closed = isClosedState(p.state);
  const stateView = STATE_VIEW[p.state];
  const term =
    p.workStartDate && p.workEndDate
      ? `${toMonthDay(p.workStartDate)}〜${toMonthDay(p.workEndDate)}`
      : null;
  const leftLabel =
    p.daysLeft === null
      ? null
      : p.daysLeft < 0
        ? "期限切れ"
        : `残り${p.daysLeft}日`;
  // 連続落選2回以上の応募者がいれば、要対応の下に警告を出す（離脱しやすい相手）
  const streaks = p.applicants
    .filter((a) => a.stats.rejectStreak >= 2)
    .sort((a, b) => b.stats.rejectStreak - a.stats.rejectStreak);

  // 応募0のまま最終日が迫っている案件は、見落とすと確実に不成立になるので
  // 行全体を薄い赤にする。期限切れ(マイナス)は既に終わっているので対象にしない。
  const isLastCall =
    p.applicantCount === 0 &&
    p.daysLeft !== null &&
    p.daysLeft >= 0 &&
    p.daysLeft <= 1;

  // align-top は必須。付けないと応募者が複数行ある行で掲載日が上下中央に浮く
  return (
    <tr
      className={
        "border-b border-slate-100 align-top " +
        (isLastCall ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50")
      }
    >
      <td className="px-3 py-2.5">
        {/* 削除済みは /api/projects/[id] が 404 を返すのでリンクにしない */}
        {p.state === "deleted" ? (
          <span className="font-bold leading-tight text-slate-700 line-through">
            {p.title}
          </span>
        ) : (
          <Link
            href={`/projects/${p.projectId}`}
            className={
              "line-clamp-2 break-words font-bold leading-tight hover:underline " +
              (closed ? "text-slate-700" : "text-[#12795a]")
            }
          >
            {p.title}
          </Link>
        )}
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-slate-400">
          <span className="truncate">
            {p.salesUser.companyName ?? "（会社未登録）"}
          </span>
          <button
            type="button"
            onClick={onOpenSales}
            className="shrink-0 rounded border border-slate-200 px-1 text-[10px] text-slate-500"
          >
            連絡先
          </button>
        </div>
      </td>

      <td className="px-2 py-2.5 text-xs tabular-nums text-slate-700">
        {toShortDate(p.createdAtJst)}
      </td>

      <td className="px-2 py-2.5 text-xs tabular-nums text-slate-700">
        {term ?? <span className="text-slate-400">－</span>}
        {leftLabel !== null && (
          <div className="mt-0.5 text-[11px] text-slate-400">{leftLabel}</div>
        )}
      </td>

      <td className="px-2 py-2.5">
        <span
          className={
            "whitespace-nowrap text-xs font-bold leading-tight " +
            stateView.className
          }
        >
          {stateView.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </td>

      <td className="px-2 py-2.5 text-right">
        <div
          className={
            "text-[15px] tabular-nums " +
            (p.applicantCount === 0
              ? "font-bold text-red-600"
              : "text-slate-700")
          }
        >
          {p.applicantCount}
        </div>
        {p.rejectedCount > 0 && (
          <div className="text-[10px] font-bold text-red-600">
            落選{p.rejectedCount}
          </div>
        )}
      </td>

      <td className="px-3 py-2.5">
        {p.applicants.length === 0 ? (
          <span className="text-[11px] text-slate-400">応募なし</span>
        ) : (
          <ul className="space-y-1">
            {p.applicants.map((a) => {
              const badge = APPLICANT_BADGE[a.status];
              return (
                <li key={a.matchId} className="flex items-center gap-1.5">
                  {a.companyId === null ? (
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                      （会社未登録）
                    </span>
                  ) : (
                    <Link
                      href={`/companies/${a.companyId}`}
                      className="min-w-0 flex-1 truncate text-xs text-slate-700 hover:underline"
                    >
                      {a.companyName}
                    </Link>
                  )}
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                    {toJstMonthDay(a.appliedAt)}
                  </span>
                  <span
                    className={
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold " +
                      badge.className
                    }
                  >
                    {badge.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenApplicant(a)}
                    title="応募実績とコメントを見る"
                    className="w-4 shrink-0 text-xs text-slate-400"
                  >
                    ⓘ
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </td>

      <td className="px-2 py-2.5">
        <VisitBadge project={p} />
      </td>

      <td className="px-3 py-2.5">
        <div
          className={
            "text-xs font-bold leading-tight " + TONE_CLASS[p.followUp.tone]
          }
        >
          {p.followUp.label}
        </div>
        {p.followUp.sub !== null && (
          <div className="mt-0.5 text-[11px] leading-tight text-slate-400">
            {p.followUp.sub}
          </div>
        )}
        {streaks.length > 0 && (
          <div className="mt-1 text-[11px] font-bold leading-tight text-red-600">
            ⚠ {streaks[0].companyName ?? "（会社未登録）"}{" "}
            {streaks[0].stats.rejectStreak}連続落選
            {streaks.length > 1 && ` 他${streaks.length - 1}社`}
          </div>
        )}
      </td>
    </tr>
  );
}

/* ---- 小さな部品 ---- */

// 断定できるのは「未訪問」側だけ。訪問ありは「アプリを開いた」までで、
// その応募を実際に見たかは分からない（元データが全ページ共通の最終訪問のため）
function VisitBadge({ project: p }: { project: AdminProjectRow }) {
  if (p.visitedAfterApply === null)
    return <span className="text-[11px] text-slate-400">－</span>;

  const reason = `最終訪問 ${toJstDateTime(p.salesUser.lastSeenAt)} / 最後の応募 ${toJstDateTime(p.lastAppliedAt)}`;
  if (p.visitedAfterApply)
    return (
      <span className="text-[11px] text-slate-500" title={reason}>
        訪問あり
      </span>
    );
  return (
    <span
      className="inline-block rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
      title={reason}
    >
      未訪問
    </span>
  );
}

function ApplicantModalBody({
  applicant: a,
}: {
  applicant: AdminProjectApplicant;
}) {
  // 落選者に電話でフォローする場面があるので、メールだけでなく電話・LINEも出す
  const contactRows: [string, string | null][] = [
    ["電話", a.contactPhone],
    ["メール", a.contactEmail],
    ["LINE", a.contactLineId],
    ["備考", a.contactNote],
  ];
  const hasContact = contactRows.some(([, value]) => value !== null);

  return (
    <>
      <div className="rounded-lg border border-slate-200 p-3 text-sm">
        <p className="font-bold text-slate-600">
          自社情報に登録された連絡先（companies）
        </p>
        {hasContact ? (
          contactRows.map(([label, value]) =>
            value === null ? null : (
              <p key={label} className="mt-1">
                <span className="text-slate-500">{label}</span>　{value}
              </p>
            ),
          )
        ) : (
          <p className="mt-1 text-slate-400">
            連絡先が登録されていません（下のログイン用メールしか手段がありません）
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
        <p className="font-bold text-slate-600">
          ログイン用メールアドレス（users）
        </p>
        <p className="mt-1">
          {a.loginEmail ?? <span className="text-slate-400">未登録</span>}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          ※ 会員登録・ログインに使うアドレスです。上の連絡先とは別物です。
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-bold text-slate-600">案件への応募実績（累計）</p>
        <p className="mt-1">
          応募 <b>{a.stats.applied}</b> 件 ／ 決定 <b>{a.stats.won}</b> ／{" "}
          <span className="text-red-600">
            落選 <b>{a.stats.lost}</b>
          </span>
        </p>
        {a.stats.rejectStreak >= 2 ? (
          <p className="mt-1 font-bold text-red-600">
            直近 {a.stats.rejectStreak}
            回連続で落選しています（離脱しやすい相手です）
          </p>
        ) : (
          <p className="mt-1 text-slate-500">
            {a.stats.rejectStreak === 1 ? "直近1回落選" : "連続落選なし"}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm font-bold text-slate-600">
        この案件への応募コメント
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm">
        {a.message ?? <span className="text-slate-400">コメントなし</span>}
      </p>
    </>
  );
}

function SalesModalBody({
  project: p,
  onFilter,
}: {
  project: AdminProjectRow;
  onFilter: () => void;
}) {
  const s = p.salesUser;
  // 自社情報（companies）の連絡先。ログイン用メールとは出どころが違うので分けて出す
  const contactRows: [string, string | null][] = [
    ["電話", s.contactPhone],
    ["メール", s.contactEmail],
    ["LINE", s.contactLineId],
    ["備考", s.contactNote],
  ];
  const hasContact = contactRows.some(([, value]) => value !== null);

  return (
    <>
      <div className="rounded-lg border border-slate-200 p-3 text-sm">
        <p className="font-bold text-slate-600">
          自社情報に登録された連絡先（companies）
        </p>
        {hasContact ? (
          contactRows.map(([label, value]) =>
            value === null ? null : (
              <p key={label} className="mt-1">
                <span className="text-slate-500">{label}</span>　{value}
              </p>
            ),
          )
        ) : (
          <p className="mt-1 text-slate-400">
            連絡先が登録されていません（下のログイン用メールしか手段がありません）
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
        <p className="font-bold text-slate-600">
          ログイン用メールアドレス（users）
        </p>
        <p className="mt-1">
          {s.loginEmail ?? <span className="text-slate-400">未登録</span>}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          ※
          会員登録・ログインに使うアドレスです。上の連絡先とは別物で、本人が連絡用に指定したものではありません。
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-bold text-slate-600">案件の投稿実績（累計）</p>
        <p className="mt-1">
          投稿 <b>{s.postTotal}</b> 件 ／ 成立 <b>{s.postWon}</b> ／{" "}
          <span className="text-red-600">
            不成立 <b>{s.postLost}</b>
          </span>{" "}
          ／ 募集中 <b>{s.postOpen}</b>
        </p>
        {s.postLost > 0 && s.postWon === 0 && (
          <p className="mt-1 font-bold text-red-600">
            成立が0件です。使い方そのものの案内が必要かもしれません
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onFilter}
        className="mt-3 w-full rounded-lg border border-[#34b38a] bg-[#34b38a]/10 py-3 text-sm font-bold text-[#12795a]"
      >
        この掲載者の案件だけ表示
      </button>
    </>
  );
}

/* ---- 凡例（既存ユーザー一覧の凡例と同じ場所・同じ書き方） ---- */
function Legend() {
  return (
    <div className="mt-3 space-y-1 text-xs text-slate-500">
      <p>
        <b className="text-slate-600">案件名</b>＝募集中は
        <b className="text-[#12795a]">緑</b>
        、終了（マッチ成立・期限切れ・削除済み）は
        <b className="text-slate-700">グレー</b>
        で、一般ページのカードと同じ基準です。クリックで案件ページへ。削除済みはリンクを開けません。
        見出しの<b>▼</b>を押すと<b>掲載者で絞り込め</b>ます。
        <b className="text-slate-600">掲載者</b>
        の隣の「連絡先」を押すと、電話・メール・LINEと
        <b>その掲載者の投稿実績</b>
        が見られ、そこから<b>その掲載者の案件だけに絞り込め</b>ます。
      </p>
      <p>
        <b className="text-slate-600">状態</b>
        ＝案件の今の状況を文字の色で表します。
        <b className="text-slate-700">募集中</b>（グレー）／
        <b className="text-[#12795a]">マッチ成立</b>（緑）／
        <b className="text-red-600">終了（不成立）</b>（赤）／
        <b className="text-slate-400">削除済み</b>（薄グレー）。
        応募が来ているかは隣の「応募」列で分かるので、募集中はまとめて
        <b>募集中</b>
        と出します。データベースには「募集中／終了」しか無いため、削除済み・期限切れはここで組み立てて表示しています。
        マッチ成立は作業完了日を過ぎても成立のままです（工期が終わっただけで、案件としては完結しているため）。
      </p>
      <p>
        <b className="text-slate-600">作業期間</b>
        ＝作業開始日〜作業完了日。下段の<b>残りN日</b>
        は作業完了日までの日数で、日本時間の今日が基準です（完了日の当日はまだ期限内）。過ぎると
        <b>期限切れ</b>になり、アプリの一覧でも「終了」として扱われます。
      </p>
      <p>
        <b className="text-slate-600">応募</b>＝この案件に
        <b>応募が来た総数</b>
        です。マッチ成立後も、落選した人を含めた総数を出します（アプリのカードに出る「応募N件」は落選を除いた数なので、そちらとは一致しません）。
        <b className="text-red-600">応募0</b>と
        <b className="text-red-600">落選N</b>
        はフォローが必要なため赤で出します。
      </p>
      <p>
        <b className="text-slate-600">応募者（申込順）</b>
        ＝上から申し込んだ順（一番上が最も早い）。会社名クリックで会社詳細へ。
        <b>決定</b>＝この人に決まった／
        <b className="text-red-600">落選</b>＝選ばれなかった／
        <b className="text-amber-700">保留</b>＝まだ決まっていない。 行末の
        <b>ⓘ</b>を押すと、その会社の
        <b>正式名・メール・応募実績（累計と連続落選）・応募コメント全文</b>
        が読めます。
      </p>
      <p>
        <b className="text-slate-600">訪問状況</b>
        ＝一番新しい応募が届いたあとに、掲載者が<b>アプリを開いたか</b>です。
        <b className="text-red-600">未訪問</b>
        ＝応募が届いてから一度もアプリを開いていない＝
        <b>応募が来たことに気づいていないと断定できます</b>
        。この場合は「決め方の案内」より先に
        <b>「応募が来ていますよ」と知らせる</b>のが先です。
        <b>訪問あり</b>
        ＝応募が届いたあとにアプリを開いてはいる、という意味までで、
        <b className="text-slate-600">
          その応募を実際に開いて中身を見たかどうかは分かりません
        </b>
        （別の目的で開いただけの可能性があります）。元データは既存の「最終訪問」列と同じもの（負荷軽減のため5分に1回まで記録）なので、数分のずれも出ます。
        <b>断定できるのは「未訪問」側だけ</b>と考えて使ってください。
      </p>
      <p>
        <b className="text-slate-600">（開発中）要対応</b>＝上段が
        <b>管理者が取る行動</b>、下段がその<b>理由と期限</b>です。判定の基準は運用しながら調整中です。
        「要対応順」で並べると
        <b>
          急ぎ（赤）→ 本日掲載（緑）→ 要連絡（橙）→ 周知（濃いグレー）→
          対応不要（薄いグレー）
        </b>
        の順になり、同じ色の中では作業完了日が近い順（取り返しがつくうちに手を打てる順）に並びます。
        ツールバー右端に<b className="text-[#12795a]">本日掲載</b>・
        <b className="text-red-600">急ぎ</b>・
        <b className="text-amber-700">要連絡</b>
        の件数を出すので、その日の作業量が先に分かります。
      </p>
      <p>
        <b className="text-red-600">行全体が薄い赤</b>＝
        <b>応募0件のまま作業完了日が明日または今日</b>
        になった案件です。見落とすとそのまま不成立になるので、行ごと目立たせています。
      </p>
      <p className="pl-3">
        <b className="text-red-600">
          赤＝放っておくと不成立が確定する／すでに不成立になった
        </b>
        もの<b>だけ</b>に付けます。
        <b className="text-amber-700">橙</b>＝急がないが連絡したいもの。
        <b className="text-[#12795a]">緑</b>
        ＝本日掲載。すぐに全ユーザーへ周知するもの。
        <b className="text-slate-700">濃いグレー</b>
        ＝やることはあるが急がないもの（周知がまだ行き届いていない可能性）。
        <b className="text-slate-500">薄いグレー</b>
        ＝通常のフローの中なので、いま動かなくてよいもの。
      </p>
      <p className="pl-3">
        ・<b className="text-slate-600">応募を知らせる</b>
        ＝応募が来ているのに掲載者が<b>気づいていない</b>
        （訪問状況が未訪問）。自然には進まないので必ず
        <b className="text-red-600">赤</b>。
        <br />・<b className="text-slate-600">決定を促す</b>
        ＝応募を見たうえで決めていない。
        <b>応募が来て数日は検討中の正常な状態</b>
        なので、次の条件のときだけ色を付けます。
        <b className="text-red-600">赤</b>
        ＝残り3日以内（もう決めないと期限切れ）または7日以上動いていない／
        <b className="text-amber-700">橙</b>＝3〜6日動いていない／
        <b>グレー</b>＝応募から2日以内で期限にも余裕あり（＝通常フロー）。
        <br />・<b className="text-slate-600">気づかず期限切れ</b>
        ＝応募が届いたあと掲載者が一度もアプリを開かないまま期限切れ。
        <b>通知が届いていない疑い</b>
        があり、アプリ側の問題の可能性があります。
        <br />・<b className="text-slate-600">決めずに期限切れ</b>
        ＝応募を見ていたのに決めないまま期限切れ。
        <b>マッチングまで進めないと案件が完結しない</b>ことを伝えます。
        <br />・<b className="text-slate-600">落選者にフォロー</b>
        ＝マッチが決まり、選ばれなかった人がいる。落ちた人にも声をかけます。
        <br />・
        <b className="text-[#12795a]">【本日掲載】全ユーザーへ新規案件周知</b>
        ＝<b>今日掲載された、まだ応募0件の案件</b>
        です。掲載初日は条件の見直しではなく周知が先なので、
        <b>すぐにLINEで全ユーザーへ知らせます</b>
        。ツールバー右端の「本日掲載N件」がその日の周知件数です。
        <br />・<b className="text-slate-700">全ユーザーへ新規案件周知</b>
        ＝応募0件だが終了日まで8日以上あります。
        <b>周知がまだ行き届いていない可能性</b>があるので、改めて知らせます。
        <br />・<b className="text-slate-600">応募が来るようフォロー</b>
        ＝応募0件で<b>終了日が近い</b>
        案件です。周知だけでは間に合わないので、条件・金額・地域の見直しが必要です（残り3日以内は
        <b className="text-red-600">赤</b>、7日以内は
        <b className="text-amber-700">橙</b>）。
        <br />・<b className="text-slate-600">応募0で終了</b>
        ＝誰も応募しないまま終わった。受け手が足りていない記録として残します。
        <br />・<b className="text-red-600">⚠ ○○ N連続落選</b>
        ＝この案件の応募者に、<b>直近N回続けて落選している会社</b>
        がいます。離脱しやすいので優先して声をかけます。
      </p>
      <p>
        <b className="text-slate-600">
          募集中のみ表示 / 終了（不成立）のみ表示 / 削除済表示
        </b>
        ＝状態での絞り込みです。
        <b>3つとも外した状態が既定</b>で、
        <b>削除済み以外のすべて（募集中・マッチ成立・終了（不成立））</b>
        が出ます。終了した案件を既定で出しているのは、落選フォローや「決めずに期限切れ」を取りこぼさないためです。
        「〜のみ表示」は<b>両方同時にチェックもできます</b>
        （その場合は募集中と終了（不成立）の2種類が出ます）。削除済みは独立したトグルで、ONにすると表示対象に加わります。
        なお<b>「マッチ成立」だけを絞り込むチェックはありません</b>
        ので、成立済みの案件を見たいときは3つとも外した既定の状態でご覧ください。
      </p>
      <p>
        対象は<b>応募できる案件（projects）のみ</b>
        です。発注待ちの事業者（requests）はこの一覧には出ません。
      </p>
    </div>
  );
}
