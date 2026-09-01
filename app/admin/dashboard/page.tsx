"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthedFetch } from "@/app/_hooks/useAuthedFetch";
import type { AdminDashboardResponse, AdminUserRow } from "@/app/_types/adminDashboard";
import { BarChart } from "./BarChart";

type Range = "1m" | "3m" | "all";
type SortKey = "registered" | "lastSeen" | "projPosts" | "postTotal" | "matches";

const daysSince = (iso: string | null) =>
  iso == null ? null : (Date.now() - new Date(iso).getTime()) / 86400000;

const agoLabel = (iso: string | null) => {
  const d = daysSince(iso);
  if (d == null) return "–";
  if (d < 1) return `${Math.max(1, Math.round(d * 24))}時間前`;
  return `${Math.round(d)}日前`;
};
const recencyClass = (iso: string | null) => {
  const d = daysSince(iso);
  if (d == null) return "text-slate-400";
  if (d >= 7) return "text-red-600 font-semibold";
  if (d >= 3) return "text-amber-600 font-semibold";
  return "text-slate-700";
};

export default function AdminDashboardPage() {
  const { data, error, isLoading } =
    useAuthedFetch<AdminDashboardResponse>("/api/admin/dashboard");
  const [range, setRange] = useState<Range>("1m");
  const [sort, setSort] = useState<SortKey>("lastSeen"); // 初期は最終訪問順

  // グラフ高さを画面の高さに合わせる（3ボックスで画面を埋める）
  const [chartH, setChartH] = useState(120);
  useEffect(() => {
    const calc = () =>
      setChartH(Math.max(90, Math.min(200, Math.round((window.innerHeight - 520) / 3))));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  if (isLoading) return <main className="p-8 text-slate-500">読み込み中…</main>;
  if (error) return <main className="p-8 text-slate-500">データの取得に失敗しました</main>;
  if (!data) return null;

  const o = data.overview;
  const d = data.daily;

  const n = range === "all" ? d.dates.length : range === "3m" ? 90 : 30;
  const cut = <T,>(arr: T[]) => arr.slice(Math.max(0, arr.length - n));
  const dts = cut(d.dates);

  const postTotal = (u: AdminUserRow) => u.projPost + u.reqPost + u.projApply + u.reqApply;
  const matchAll = (u: AdminUserRow) => u.projMatch + u.reqMatch + u.projApplyMatch + u.reqApplyMatch;
  const sorters: Record<SortKey, (a: AdminUserRow, b: AdminUserRow) => number> = {
    registered: (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    lastSeen: (a, b) => (daysSince(a.lastSeenAt) ?? 1e9) - (daysSince(b.lastSeenAt) ?? 1e9), 
    projPosts: (a, b) => b.projPost - a.projPost,
    postTotal: (a, b) => postTotal(b) - postTotal(a),
    matches: (a, b) => matchAll(b) - matchAll(a),
  };
  const users = [...data.users].sort(sorters[sort]);

  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-14">
      <div className="mt-4 mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-wide">概況</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">範囲</span>
          <div className="flex rounded-full border border-slate-200 bg-slate-100 p-[3px]">
            {(["1m", "3m", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  "rounded-full px-3.5 py-1.5 text-xs " +
                  (range === r ? "bg-white font-bold text-[#12795a] shadow" : "text-slate-600")
                }
              >
                {{ "1m": "1ヶ月", "3m": "3ヶ月", all: "全期間" }[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <PanelTitle main="応募できる案件" sub="仕事を発注したい側の投稿" />
          <div className="grid grid-cols-3">
            <StatTile label="募集中" value={o.projects.open}>
              <BarChart values={cut(d.projects.open)} dates={dts} color="green" height={chartH} />
            </StatTile>
            <StatTile label="マッチ済" value={o.projects.matched} rate={o.projects.matchRate}>
              <BarChart values={cut(d.projects.matched)} dates={dts} color="green" height={chartH} />
            </StatTile>
            <StatTile label="累積（募集中＋終了）" value={o.projects.total}>
              <BarChart values={cut(d.projects.total)} dates={dts} color="grey" height={chartH} />
            </StatTile>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <PanelTitle main="発注待ちの事業者" sub="仕事を受注したい側の投稿" dark />
          <div className="grid grid-cols-3">
            <StatTile label="募集中" value={o.requests.open}>
              <BarChart values={cut(d.requests.open)} dates={dts} color="green" height={chartH} />
            </StatTile>
            <StatTile label="マッチ済" value={o.requests.matched} rate={o.requests.matchRate}>
              <BarChart values={cut(d.requests.matched)} dates={dts} color="green" height={chartH} />
            </StatTile>
            <StatTile label="累積（募集中＋終了）" value={o.requests.total}>
              <BarChart values={cut(d.requests.total)} dates={dts} color="grey" height={chartH} />
            </StatTile>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <PanelTitle main="企業情報登録済みユーザー" />
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold tabular-nums">
              {o.totalCompanies}
              <span className="ml-1 text-sm font-semibold text-slate-500">社</span>
            </div>
            <div className="text-xs text-slate-500">
              会員登録 <b className="text-slate-700">{o.totalUsers}</b> 名 ・ 登録率 {o.registrationRate}%
            </div>
          </div>
          <div className="mt-1">
            <BarChart values={cut(d.companies)} dates={dts} color="green" height={chartH} />
          </div>
        </section>
      </div>

      <h2 className="mt-7 mb-3 text-base font-bold tracking-wide">ユーザー一覧</h2>
      <div className="max-h-[calc(100vh-72px)] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <span className="mr-1 text-xs text-slate-500">並び替え</span>
          {(
            [
              ["registered", "登録順"],
              ["lastSeen", "最終訪問"],
              ["projPosts", "案件投稿数"],
              ["postTotal", "投稿応募合計"],
              ["matches", "マッチ数"],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (sort === k
                  ? "border-[#34b38a] bg-[#34b38a]/10 font-bold text-[#12795a]"
                  : "border-slate-200 text-slate-600")
              }
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">{data.users.length}名を表示</span>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="[&_th]:sticky [&_th]:top-[41px] [&_th]:z-10 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:pt-2 [&_th]:pb-1 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-bold [&_th]:text-slate-500">
            <th colSpan={8}>基本情報</th>
              <th colSpan={4} className="border-l border-slate-300 !text-[#12795a]">投稿（自分が出す）</th>
              <th colSpan={4} className="border-l border-slate-300 !text-[#12795a]">応募（自分が応募する）</th>
            </tr>
            <tr className="[&_th]:sticky [&_th]:top-[67px] [&_th]:z-10 [&_th]:border-b [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:pb-2 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:text-slate-600">
              <th className="!text-left">会社 / メール</th>
              <th className="!text-left">登録</th>
              <th className="!text-left">最終訪問</th>{/* ← 追加 */}
              <th className="!text-left">最終ログイン</th>
              <th className="!text-left">最終活動</th>
              <th className="!text-right">レビュー</th>
              <th className="!text-right">記事</th>
              <th className="!text-right">動画</th>
              <th className="border-l border-slate-300 !text-right">案件投稿</th>
              <th className="!text-right">ﾏｯﾁ</th>
              <th className="!text-right">依頼投稿</th>
              <th className="!text-right">ﾏｯﾁ</th>
              <th className="border-l border-slate-300 !text-right">案件応募</th>
              <th className="!text-right">ﾏｯﾁ</th>
              <th className="!text-right">依頼応募</th>
              <th className="!text-right">ﾏｯﾁ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const na = u.companyId == null;
              return (
                <tr key={u.userId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    {na ? (
                      <span className="font-bold text-slate-600">（会社未登録）</span>
                    ) : (
                      <Link href={`/companies/${u.companyId}`} className="font-bold text-[#12795a] hover:underline">
                        {u.companyName}
                      </Link>
                    )}
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-2 py-2.5 text-xs tabular-nums text-slate-700">
                    {u.registeredAt.slice(2, 10).replace(/-/g, "/")}
                  </td>
                  <td className={"px-2 py-2.5 text-xs tabular-nums " + recencyClass(u.lastSeenAt)}>
                    {agoLabel(u.lastSeenAt)}
                  </td>
                  <td className={"px-2 py-2.5 text-xs tabular-nums " + recencyClass(u.lastLoginAt)}>
                    {agoLabel(u.lastLoginAt)}
                  </td>
                  <td className={"px-2 py-2.5 text-xs tabular-nums " + recencyClass(u.lastActivityAt)}>
                    {agoLabel(u.lastActivityAt)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-700">
                    {u.reviewAvg != null ? `★${u.reviewAvg}(${u.reviewCount})` : <span className="text-slate-400">–</span>}
                  </td>
                  <td className="px-2 py-2.5 text-right"><Flag v={na ? null : u.hasArticle} /></td>
                  <td className="px-2 py-2.5 text-right"><Flag v={na ? null : u.hasVideo} /></td>
                  <Num v={na ? null : u.projPost} sep />
                  <Num v={na ? null : u.projMatch} />
                  <Num v={na ? null : u.reqPost} />
                  <Num v={na ? null : u.reqMatch} />
                  <Num v={na ? null : u.projApply} sep />
                  <Num v={na ? null : u.projApplyMatch} />
                  <Num v={na ? null : u.reqApply} />
                  <Num v={na ? null : u.reqApplyMatch} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p>
          <b className="text-slate-600">最終ログイン</b>
          ＝メール・パスワードで<b>サインインし直した</b>最後の日時。一度ログインするとセッション（Cookie）が保持されるため、
          <b>再ログインせずに開いている間は更新されません</b>（実際はもっと最近使っている場合があります）。3日以上オレンジ・7日以上赤。
        </p>
        <p>
          <b className="text-slate-600">最終訪問</b>
          ＝アプリを<b>開いた（ページを表示した）</b>最後の日時。ログイン状態のまま見に来た場合もこれで分かります（負荷軽減のため<b>5分に1回まで</b>記録）。「アクティブに来ているか」はこの列で判断します。
        </p>
        <p>
          <b className="text-slate-600">最終活動</b>
          ＝アプリ内で<b>データベースに記録される操作</b>をした最後の日時。
          <b>案件・依頼の投稿／応募／マッチ（連絡先）カードを開く／レビュー投稿</b>などで更新されます。
          一覧や詳細を<b>閲覧するだけ</b>（記録が残らない操作）では更新されません。
        </p>
        <p>
          案件＝応募できる案件／依頼＝発注待ちの事業者。投稿・応募の「0」と記事・動画の「−」は赤。会社名クリックで会社詳細へ。
        </p>
      </div>
    </main>
  );
}

/* ---- 小さな部品 ---- */
function PanelTitle({ main, sub, dark }: { main: string; sub?: string; dark?: boolean }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-2.5">
      <span className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: dark ? "#127a55" : "#34b38a" }} />
        {main}
      </span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

function StatTile({
  label,
  value,
  rate,
  children,
}: {
  label: string;
  value: number;
  rate?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-1 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-slate-200">
      <div className="flex gap-5">
        <div>
          <div className="text-xs text-slate-600">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
        {rate != null && (
          <div>
            <div className="text-xs text-slate-600">マッチ率</div>
            <div className="text-2xl font-bold tabular-nums">{rate}%</div>
          </div>
        )}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Flag({ v }: { v: boolean | null }) {
  if (v == null) return <span className="text-slate-400">–</span>;
  return v ? (
    <span className="inline-grid h-5 w-5 place-items-center rounded bg-[#34b38a]/15 font-bold text-[#12795a]">✓</span>
  ) : (
    <span className="inline-grid h-5 w-5 place-items-center rounded bg-red-500/10 font-bold text-red-600">−</span>
  );
}

function Num({ v, sep }: { v: number | null; sep?: boolean }) {
  const border = sep ? "border-l border-slate-300 " : "";
  if (v == null) return <td className={border + "px-4 py-2.5 text-right text-slate-400"}>–</td>;
  return (
    <td className={border + "px-4 py-2.5 text-right text-[15px] tabular-nums " + (v === 0 ? "font-bold text-red-600" : "text-slate-700")}>
      {v}
    </td>
  );
}
